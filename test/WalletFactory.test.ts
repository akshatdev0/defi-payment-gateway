import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import chai, { expect } from "chai";
import { FakeContract, smock } from "@defi-wonderland/smock";

import { USD, USD__factory, WalletFactory, WalletFactory__factory, Wallet__factory } from "../types";
import { keccak, bigNumberify, getCreate2Address } from "./shared/utilities";

const { keccak256 } = ethers.utils;

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
  const INIT_CODE_HASH = "0x79b8071417ed7109c7e1d6474ccec39a75b4578c3a526aedd173f5536b17d0ea";

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
    it("can be deployed and initialized only once", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
        ownerAddress,
        treasuryAddress,
      ])) as WalletFactory;
      await walletFactory.deployed();

      await expect(walletFactory.connect(deployer).initialize(ownerAddress, treasuryAddress)).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });

    it("will not allow a 0x0 Owner address", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      await expect(upgrades.deployProxy(walletFactory__factory, [ZERO_ADDRESS, treasuryAddress])).to.be.revertedWith(
        "WalletFactory: new owner is the zero address",
      );
    });

    it("will not allow a 0x0 Treasury address", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      await expect(upgrades.deployProxy(walletFactory__factory, [ownerAddress, ZERO_ADDRESS])).to.be.revertedWith(
        "WalletFactory: new treasury is the zero address",
      );
    });
  });

  describe("post-initialization", function () {
    describe("validations", function () {
      beforeEach(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          ownerAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("has an owner", async function () {
        expect(await walletFactory.owner()).to.equal(ownerAddress);
      });

      describe("create2", () => {
        it("generates correct addresses", async () => {
          const bytecode = Wallet__factory.bytecode;
          const initCodeHash = keccak256(bytecode);
          let generatedAddress: string;

          const log = (sender: string, salt: string, initCodeHash: string, generatedAddress: string) => {
            console.log("");
            console.log("Inputs:");
            console.log(`- sender            : ${sender}`);
            console.log(`- salt              : ${salt}`);
            console.log(`- init_code_hash    : ${initCodeHash}`);
            console.log("Outputs:");
            console.log(`- generated_address : ${generatedAddress}`);
            console.log("");
          };

          expect(initCodeHash).to.be.equal(INIT_CODE_HASH);

          generatedAddress = getCreate2Address(walletFactory.address, USER_IDENTIFIER_1, bytecode);
          log(walletFactory.address, USER_IDENTIFIER_1, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0xD20Cbc95BDab4c016E71317D23065B6b17bEcab3");

          generatedAddress = getCreate2Address(walletFactory.address, USER_IDENTIFIER_2, bytecode);
          log(walletFactory.address, USER_IDENTIFIER_2, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0x82348545F7944ac0B0Ff74104aFc6B7a290E72d2");

          generatedAddress = getCreate2Address(deployerAddress, USER_IDENTIFIER_1, bytecode);
          log(deployerAddress, USER_IDENTIFIER_1, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0xe556F081634891b401b7Fe34bD1624E72AcE7BE8");

          generatedAddress = getCreate2Address(deployerAddress, USER_IDENTIFIER_2, bytecode);
          log(deployerAddress, USER_IDENTIFIER_2, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0xc93Aa68747e99EB93f329083E55efA1C7A78142f");
        });
      });
    });

    describe("create wallet", function () {
      before(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
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
          .withArgs(identifier, walletAddress);
        await expect(walletFactory.connect(owner).createWallet(identifier)).to.be.reverted; // WALLET_EXISTS

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
          .withArgs(identifier, walletAddress);
        await expect(walletFactory.connect(owner).createWallet(identifier)).to.be.reverted; // WALLET_EXISTS

        const wallet = new Wallet__factory(deployer).attach(walletAddress);
        expect(await wallet.owner()).to.eq(walletFactory.address);

        await expect(wallet.connect(deployer).initialize(deployerAddress)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });
    });

    describe("transfer ownership", function () {
      beforeEach(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
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
        const walletFactory__factory = new WalletFactory__factory(deployer);
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
      let usdFake: FakeContract<USD>;

      beforeEach(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          ownerAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();

        const usd__factory = new USD__factory(deployer);
        usdFake = await smock.fake(usd__factory);
      });

      it("prevents non-owners from transferring", async function () {
        const identifier = USER_IDENTIFIER_1;
        const bytecode = Wallet__factory.bytecode;
        const walletAddress = getCreate2Address(walletFactory.address, identifier, bytecode);
        await expect(
          walletFactory.connect(deployer).transferFrom(walletAddress, usdFake.address, _1_000),
        ).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(
          walletFactory.connect(other).transferFrom(walletAddress, usdFake.address, _1_000),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });
});
