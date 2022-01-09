import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import chai, { expect } from "chai";
import { smock } from "@defi-wonderland/smock";

import { WalletFactory, WalletFactory__factory, Wallet__factory } from "../../types";
import { keccak, bigNumberify, getCreate2Address } from "../shared/utilities";

chai.use(smock.matchers);

describe("WalletFactory Unit tests", function () {
  // Accounts
  let deployer: Signer;
  let owner: Signer;
  //   let alice: Signer;
  //   let bob: Signer;
  //   let eve: Signer;

  let deployerAddress: string;
  let ownerAddress: string;
  //   let aliceAddress: string;
  //   let bobAddress: string;
  //   let eveAddress: string;

  let factory: WalletFactory;

  const USER_IDENTIFIER_1 = keccak("1");

  before(async function () {
    [deployer, owner] = await ethers.getSigners();
    [deployerAddress, ownerAddress] = await Promise.all([deployer.getAddress(), owner.getAddress()]);
  });

  beforeEach(async function () {
    // Deploy WalletFactory
    const factory__factory = await new WalletFactory__factory(deployer);
    factory = (await upgrades.deployProxy(factory__factory, [ownerAddress])) as WalletFactory;
    await factory.deployed();
  });

  describe("validations", function () {
    it("has an owner", async function () {
      expect(await factory.owner()).to.equal(ownerAddress);
    });
  });

  describe("createWallet", function () {
    it("can only be called by owner", async function () {
      await expect(factory.connect(deployer).createWallet(USER_IDENTIFIER_1)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("owner creates a new wallet", async function () {
      const identifier = USER_IDENTIFIER_1;
      const bytecode = Wallet__factory.bytecode;
      const walletAddress = getCreate2Address(factory.address, identifier, bytecode);

      await expect(factory.connect(owner).createWallet(identifier))
        .to.emit(factory, "WalletCreated")
        .withArgs(identifier, walletAddress, bigNumberify(1));
      await expect(factory.connect(owner).createWallet(identifier)).to.be.reverted; // WALLET_EXISTS
      expect(await factory.getWallet(identifier)).to.eq(walletAddress);
      expect(await factory.allWallets(0)).to.eq(walletAddress);
      expect(await factory.totalWallets()).to.eq(1);
    });
  });
});
