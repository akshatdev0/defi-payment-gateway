import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import chai, { expect } from "chai";
import { smock } from "@defi-wonderland/smock";

import { WalletFactory, WalletFactory__factory, Wallet__factory } from "../../types";
import { keccak, bigNumberify, getCreate2Address } from "../shared/utilities";

chai.use(smock.matchers);

describe("WalletFactory Unit Tests", function () {
  // Accounts
  let deployer: Signer;
  let owner: Signer;
  let treasury: Signer;
  let other: Signer;

  let deployerAddress: string;
  let ownerAddress: string;
  let treasuryAddress: string;
  let otherAddress: string;

  let walletFactory: WalletFactory;

  const ZERO_ADDRESS = ethers.constants.AddressZero;
  const USER_IDENTIFIER_1 = keccak("1");
  const USER_IDENTIFIER_2 = keccak("2");
  const _1_000 = bigNumberify("1000000000");

  before(async function () {
    [deployer, owner, treasury, other] = await ethers.getSigners();
    [deployerAddress, ownerAddress, treasuryAddress, otherAddress] = await Promise.all([
      deployer.getAddress(),
      owner.getAddress(),
      treasury.getAddress(),
      other.getAddress(),
    ]);
  });

  describe("initialization", () => {
    it("can be initialized and deployed", async () => {
      const walletFactory__factory = await new WalletFactory__factory(deployer);
      walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
        ownerAddress,
        treasuryAddress,
      ])) as WalletFactory;
      await walletFactory.deployed();
    });

    it("will not allow a 0x0 Owner address", async () => {
      const walletFactory__factory = await new WalletFactory__factory(deployer);
      await expect(upgrades.deployProxy(walletFactory__factory, [ZERO_ADDRESS, treasuryAddress])).to.be.reverted;
    });

    it("will not allow a 0x0 Treasury address", async () => {
      const walletFactory__factory = await new WalletFactory__factory(deployer);
      await expect(upgrades.deployProxy(walletFactory__factory, [ownerAddress, ZERO_ADDRESS])).to.be.reverted;
    });
  });

  describe("post-initialization", function () {
    describe("validations", function () {
      before(async function () {
        const walletFactory__factory = await new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          ownerAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("has an owner", async function () {
        expect(await walletFactory.owner()).to.equal(ownerAddress);
      });
    });

    describe("create wallet", function () {
      before(async function () {
        const walletFactory__factory = await new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          ownerAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("can only be called by owner", async function () {
        await expect(walletFactory.connect(deployer).createWallet(USER_IDENTIFIER_1)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("owner creates a new wallet", async function () {
        const identifier = USER_IDENTIFIER_1;
        const bytecode = Wallet__factory.bytecode;
        const walletAddress = getCreate2Address(walletFactory.address, identifier, bytecode);

        await expect(walletFactory.connect(owner).createWallet(identifier))
          .to.emit(walletFactory, "WalletCreated")
          .withArgs(identifier, walletAddress, bigNumberify(1));
        await expect(walletFactory.connect(owner).createWallet(identifier)).to.be.reverted; // WALLET_EXISTS
        expect(await walletFactory.getWallet(identifier)).to.eq(walletAddress);
        expect(await walletFactory.allWallets(0)).to.eq(walletAddress);
        expect(await walletFactory.totalWallets()).to.eq(1);

        const wallet = new Wallet__factory(deployer).attach(walletAddress);
        expect(await wallet.owner()).to.eq(walletFactory.address);

        await expect(wallet.connect(deployer).initialize(deployerAddress)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });

      it("owner creates another new wallet", async function () {
        const identifier = USER_IDENTIFIER_2;
        const bytecode = Wallet__factory.bytecode;
        const walletAddress = getCreate2Address(walletFactory.address, identifier, bytecode);

        await expect(walletFactory.connect(owner).createWallet(identifier))
          .to.emit(walletFactory, "WalletCreated")
          .withArgs(identifier, walletAddress, bigNumberify(2));
        await expect(walletFactory.connect(owner).createWallet(identifier)).to.be.reverted; // WALLET_EXISTS
        expect(await walletFactory.getWallet(identifier)).to.eq(walletAddress);
        expect(await walletFactory.allWallets(1)).to.eq(walletAddress);
        expect(await walletFactory.totalWallets()).to.eq(2);

        const wallet = new Wallet__factory(deployer).attach(walletAddress);
        expect(await wallet.owner()).to.eq(walletFactory.address);

        await expect(wallet.connect(deployer).initialize(deployerAddress)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });
    });

    describe("transfer ownership", function () {
      beforeEach(async function () {
        const walletFactory__factory = await new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          ownerAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("changes owner after transfer", async function () {
        await expect(walletFactory.connect(owner).transferOwnership(otherAddress))
          .to.emit(walletFactory, "OwnershipTransferred")
          .withArgs(ownerAddress, otherAddress);
        expect(await walletFactory.owner()).to.equal(otherAddress);
      });

      it("prevents non-owners from transferring", async function () {
        await expect(walletFactory.connect(deployer).transferOwnership(otherAddress)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
        await expect(walletFactory.connect(other).transferOwnership(otherAddress)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("guards ownership against stuck state", async function () {
        await expect(walletFactory.connect(owner).transferOwnership(ZERO_ADDRESS)).to.be.revertedWith(
          "Ownable: new owner is the zero address",
        );
      });
    });

    describe("update treasury", function () {
      beforeEach(async function () {
        const walletFactory__factory = await new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          ownerAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("changes treasury after update", async function () {
        await expect(walletFactory.connect(owner).updateTreasury(otherAddress))
          .to.emit(walletFactory, "TreasuryUpdated")
          .withArgs(treasuryAddress, otherAddress);
        expect(await walletFactory.treasury()).to.equal(otherAddress);
      });

      it("prevents non-owners from updating", async function () {
        await expect(walletFactory.connect(deployer).updateTreasury(otherAddress)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
        await expect(walletFactory.connect(other).updateTreasury(otherAddress)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("guards treasury against stuck state", async function () {
        await expect(walletFactory.connect(owner).updateTreasury(ZERO_ADDRESS)).to.be.revertedWith(
          "WalletFactory: new treasury is the zero address",
        );
      });
    });

    describe("transfer from", function () {
      beforeEach(async function () {
        const walletFactory__factory = await new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          ownerAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("prevents non-owners from transferring", async function () {
        const identifier = USER_IDENTIFIER_1;
        await expect(walletFactory.connect(deployer).transferFrom(identifier, otherAddress, _1_000)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
        await expect(walletFactory.connect(other).transferFrom(identifier, otherAddress, _1_000)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });
    });
  });
});
