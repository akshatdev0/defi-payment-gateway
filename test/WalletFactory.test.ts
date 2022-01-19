import { ethers } from "hardhat";
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
  const INIT_CODE_HASH = "0x4ab95e49cb25d51d6c2ab480a3988a681362eb6b1c1cb340033dbc92db8043fc";

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
    it("can be deployed", async () => {
      walletFactory = await new WalletFactory__factory(deployer).deploy(ownerAddress, treasuryAddress);
      await walletFactory.deployed();
    });

    it("will not allow a 0x0 Owner address", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      await expect(walletFactory__factory.deploy(ZERO_ADDRESS, treasuryAddress)).to.be.revertedWith(
        "WalletFactory: new owner is the zero address",
      );
    });

    it("will not allow a 0x0 Treasury address", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      await expect(walletFactory__factory.deploy(ownerAddress, ZERO_ADDRESS)).to.be.revertedWith(
        "WalletFactory: new treasury is the zero address",
      );
    });
  });

  describe("post-initialization", function () {
    describe("validations", function () {
      beforeEach(async function () {
        walletFactory = await new WalletFactory__factory(deployer).deploy(ownerAddress, treasuryAddress);
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
          expect(generatedAddress).to.be.equal("0x8bF748Cb2EdBEa7BE3717504072a2114Ec63218D");

          generatedAddress = getCreate2Address(walletFactory.address, USER_IDENTIFIER_2, bytecode);
          log(walletFactory.address, USER_IDENTIFIER_2, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0x11587bf5ab047aec7FF38882C8D199637c3C68fb");

          generatedAddress = getCreate2Address(deployerAddress, USER_IDENTIFIER_1, bytecode);
          log(deployerAddress, USER_IDENTIFIER_1, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0xc56e772453ba89b62EFDEeFb1344A9c20f3c4A9f");

          generatedAddress = getCreate2Address(deployerAddress, USER_IDENTIFIER_2, bytecode);
          log(deployerAddress, USER_IDENTIFIER_2, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0xdF9E4de2fc23e6700c90E17c11452d8EfBDD5a00");
        });
      });
    });

    describe("create wallet", function () {
      before(async function () {
        walletFactory = await new WalletFactory__factory(deployer).deploy(ownerAddress, treasuryAddress);
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
        walletFactory = await new WalletFactory__factory(deployer).deploy(ownerAddress, treasuryAddress);
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
        walletFactory = await new WalletFactory__factory(deployer).deploy(ownerAddress, treasuryAddress);
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
        walletFactory = await new WalletFactory__factory(deployer).deploy(ownerAddress, treasuryAddress);
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
