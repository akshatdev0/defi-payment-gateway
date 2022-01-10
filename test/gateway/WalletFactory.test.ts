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

  let deployerAddress: string;
  let ownerAddress: string;
  let treasuryAddress: string;

  let walletFactory: WalletFactory;

  const USER_IDENTIFIER_1 = keccak("1");
  const USER_IDENTIFIER_2 = keccak("2");

  before(async function () {
    [deployer, owner, treasury] = await ethers.getSigners();
    [deployerAddress, ownerAddress, treasuryAddress] = await Promise.all([
      deployer.getAddress(),
      owner.getAddress(),
      treasury.getAddress(),
    ]);

    // Deploy WalletFactory
    const walletFactory__factory = await new WalletFactory__factory(deployer);
    walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
      ownerAddress,
      treasuryAddress,
    ])) as WalletFactory;
    await walletFactory.deployed();
  });

  describe("validations", function () {
    it("has an owner", async function () {
      expect(await walletFactory.owner()).to.equal(ownerAddress);
    });
  });

  describe("createWallet", function () {
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
});
