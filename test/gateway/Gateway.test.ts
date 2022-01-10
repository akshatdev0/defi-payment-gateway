import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import chai, { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";

import { USD, USD__factory, WalletFactory, WalletFactory__factory, Wallet__factory } from "../../types";
import { keccak, bigNumberify, getCreate2Address } from "../shared/utilities";

chai.use(smock.matchers);

describe("Gateway Tests", function () {
  // Accounts
  let deployer: Signer;
  let owner: Signer;
  let treasury: Signer;
  let alice: Signer;
  let bob: Signer;
  let eve: Signer;

  let deployerAddress: string;
  let ownerAddress: string;
  let treasuryAddress: string;
  let aliceAddress: string;
  let bobAddress: string;
  let eveAddress: string;

  let walletFactory: WalletFactory;
  let usd: MockContract<USD>;

  const BOB_IDENTIFIER = keccak("2");
  const _0 = bigNumberify("0");
  const _1_000 = bigNumberify("1000000000");
  const _5_000 = bigNumberify("5000000000");
  const _100_000 = bigNumberify("100000000000");
  const _200_000 = bigNumberify("200000000000");
  const _300_000 = bigNumberify("300000000000");
  const _400_000 = bigNumberify("400000000000");
  const _500_000 = bigNumberify("500000000000");

  before(async function () {
    [deployer, owner, treasury, alice, bob, eve] = await ethers.getSigners();
    [deployerAddress, ownerAddress, treasuryAddress, aliceAddress, bobAddress, eveAddress] = await Promise.all([
      deployer.getAddress(),
      owner.getAddress(),
      treasury.getAddress(),
      alice.getAddress(),
      bob.getAddress(),
      eve.getAddress(),
    ]);
  });

  beforeEach(async function () {
    // Deploy WalletFactory
    const walletFactory__factory = await new WalletFactory__factory(deployer);
    walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
      ownerAddress,
      treasuryAddress,
    ])) as WalletFactory;
    await walletFactory.deployed();

    // Deploy USD Token
    const usd__factory = await smock.mock<USD__factory>("USD");
    usd = await usd__factory.deploy();
    await usd.deployed();

    // Initialize balances
    // - USD
    usd.connect(deployer).transfer(aliceAddress, _100_000);
    usd.connect(deployer).transfer(bobAddress, _200_000);
    usd.connect(deployer).transfer(eveAddress, _300_000);
  });

  describe("validations", function () {
    it("balances", async function () {
      expect(await usd.balanceOf(treasuryAddress)).to.equal(_0);
      expect(await usd.balanceOf(aliceAddress)).to.equal(_100_000);
      expect(await usd.balanceOf(bobAddress)).to.equal(_200_000);
      expect(await usd.balanceOf(eveAddress)).to.equal(_300_000);
      expect(await usd.balanceOf(deployerAddress)).to.equal(_400_000);
    });
  });

  describe("processes transactions", function () {
    it("bob sends 5000 USD tokens", async function () {
      const identifier = BOB_IDENTIFIER;
      const bytecode = Wallet__factory.bytecode;
      const walletAddress = getCreate2Address(walletFactory.address, identifier, bytecode);

      // Balances
      expect(await usd.balanceOf(bobAddress)).to.equal(_200_000);
      expect(await usd.balanceOf(treasuryAddress)).to.equal(_0);
      expect(await usd.balanceOf(walletAddress)).to.equal(_0);

      // Bob sends USD 5000 tokens to a pre-deterministic smart-contract wallet address
      await expect(usd.connect(bob).transfer(walletAddress, _5_000))
        .to.emit(usd, "Transfer")
        .withArgs(bobAddress, walletAddress, _5_000);
      expect(await usd.balanceOf(bobAddress)).to.equal(_200_000.sub(_5_000));
      expect(await usd.balanceOf(walletAddress)).to.equal(_5_000);

      // After detecting deposit, owner creates smart-wallet for Bob at the pre-determined address
      await expect(walletFactory.connect(owner).createWallet(identifier))
        .to.emit(walletFactory, "WalletCreated")
        .withArgs(identifier, walletAddress, bigNumberify(1));

      // Owner transfers funds from Bob's smart-wallet to treasury
      await expect(walletFactory.connect(owner).transferFrom(identifier, usd.address, _5_000))
        .to.emit(usd, "Transfer")
        .withArgs(walletAddress, treasuryAddress, _5_000);

      // Final Balances
      expect(await usd.balanceOf(bobAddress)).to.equal(_200_000.sub(_5_000));
      expect(await usd.balanceOf(treasuryAddress)).to.equal(_5_000);
      expect(await usd.balanceOf(walletAddress)).to.equal(_0);
    });
  });
});
