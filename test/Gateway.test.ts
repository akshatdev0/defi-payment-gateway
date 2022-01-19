import { ethers } from "hardhat";
import { Signer } from "ethers";
import chai, { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";

import { USD, USD__factory, WalletFactory, WalletFactory__factory, Wallet__factory } from "../types";
import { keccak, bigNumberify, getCreate2Address } from "./shared/utilities";

chai.use(smock.matchers);

describe("Gateway Tests", function () {
  // Accounts
  let deployer: Signer;
  let admin: Signer;
  let app: Signer;
  let treasury: Signer;
  let alice: Signer;
  let bob: Signer;
  let eve: Signer;

  let deployerAddress: string;
  let adminAddress: string;
  let appAddress: string;
  let treasuryAddress: string;
  let aliceAddress: string;
  let bobAddress: string;
  let eveAddress: string;

  let walletFactory: WalletFactory;
  let usdMock: MockContract<USD>;

  const ALICE_IDENTIFIER = keccak("1");
  const BOB_IDENTIFIER = keccak("2");
  const EVE_IDENTIFIER = keccak("3");
  const _0 = bigNumberify("0");
  const _1_000 = bigNumberify("1000000000");
  const _2_000 = bigNumberify("2000000000");
  const _3_000 = bigNumberify("3000000000");
  const _4_000 = bigNumberify("4000000000");
  const _5_000 = bigNumberify("5000000000");
  const _5_001 = bigNumberify("5001000000");
  const _100_000 = bigNumberify("100000000000");
  const _200_000 = bigNumberify("200000000000");
  const _300_000 = bigNumberify("300000000000");
  const _400_000 = bigNumberify("400000000000");

  before(async function () {
    [deployer, admin, app, treasury, alice, bob, eve] = await ethers.getSigners();
    [deployerAddress, adminAddress, appAddress, treasuryAddress, aliceAddress, bobAddress, eveAddress] =
      await Promise.all([
        deployer.getAddress(),
        admin.getAddress(),
        app.getAddress(),
        treasury.getAddress(),
        alice.getAddress(),
        bob.getAddress(),
        eve.getAddress(),
      ]);
  });

  beforeEach(async function () {
    // Deploy WalletFactory
    walletFactory = await new WalletFactory__factory(deployer).deploy(adminAddress, appAddress, treasuryAddress);
    await walletFactory.deployed();

    // Deploy USD Token
    const usd__factory = await smock.mock<USD__factory>("USD");
    usdMock = await usd__factory.deploy();
    await usdMock.deployed();

    // Initialize balances
    // - USD
    await usdMock.connect(deployer).transfer(aliceAddress, _100_000);
    await usdMock.connect(deployer).transfer(bobAddress, _200_000);
    await usdMock.connect(deployer).transfer(eveAddress, _300_000);
  });

  describe("validations", function () {
    it("balances", async function () {
      expect(await usdMock.balanceOf(treasuryAddress)).to.equal(_0);
      expect(await usdMock.balanceOf(aliceAddress)).to.equal(_100_000);
      expect(await usdMock.balanceOf(bobAddress)).to.equal(_200_000);
      expect(await usdMock.balanceOf(eveAddress)).to.equal(_300_000);
      expect(await usdMock.balanceOf(deployerAddress)).to.equal(_400_000);
    });
  });

  describe("processes transactions", function () {
    it("bob deposits 5000 USD tokens", async function () {
      const identifier = BOB_IDENTIFIER;
      const bytecode = Wallet__factory.bytecode;
      const bobWallet = getCreate2Address(walletFactory.address, identifier, bytecode);

      // Balances
      expect(await usdMock.balanceOf(bobAddress)).to.equal(_200_000);
      expect(await usdMock.balanceOf(treasuryAddress)).to.equal(_0);
      expect(await usdMock.balanceOf(bobWallet)).to.equal(_0);

      // Bob sends USD 5000 tokens to a pre-deterministic smart-contract wallet address
      await expect(usdMock.connect(bob).transfer(bobWallet, _5_000))
        .to.emit(usdMock, "Transfer")
        .withArgs(bobAddress, bobWallet, _5_000);
      expect(await usdMock.balanceOf(bobAddress)).to.equal(_200_000.sub(_5_000));
      expect(await usdMock.balanceOf(bobWallet)).to.equal(_5_000);

      // After detecting deposit, app creates smart-wallet for Bob at the pre-determined address
      await expect(walletFactory.connect(app).createWallet(identifier))
        .to.emit(walletFactory, "WalletCreated")
        .withArgs(identifier, bobWallet);

      // App fails to transfer amount exceeding balance from Bob's smart-wallet to treasury
      await expect(walletFactory.connect(app).transferFrom(bobWallet, usdMock.address, _5_001)).to.be.revertedWith(
        "ERC20: transfer amount exceeds balance",
      );

      // App can transfer less amount from Bob's smart-wallet to treasury
      await expect(walletFactory.connect(app).transferFrom(bobWallet, usdMock.address, _3_000))
        .to.emit(usdMock, "Transfer")
        .withArgs(bobWallet, treasuryAddress, _3_000);

      // Balances
      expect(await usdMock.balanceOf(bobAddress)).to.equal(_200_000.sub(_5_000));
      expect(await usdMock.balanceOf(treasuryAddress)).to.equal(_3_000);
      expect(await usdMock.balanceOf(bobWallet)).to.equal(_2_000);

      // App transfers whole amount from Bob's smart-wallet to treasury
      await expect(walletFactory.connect(app).transferFrom(bobWallet, usdMock.address, _2_000))
        .to.emit(usdMock, "Transfer")
        .withArgs(bobWallet, treasuryAddress, _2_000);

      // Final Balances
      expect(await usdMock.balanceOf(bobAddress)).to.equal(_200_000.sub(_5_000));
      expect(await usdMock.balanceOf(treasuryAddress)).to.equal(_5_000);
      expect(await usdMock.balanceOf(bobWallet)).to.equal(_0);
    });

    it("alice & eve deposit USD tokens", async function () {
      const bytecode = Wallet__factory.bytecode;
      const aliceWallet = getCreate2Address(walletFactory.address, ALICE_IDENTIFIER, bytecode);
      const eveWallet = getCreate2Address(walletFactory.address, EVE_IDENTIFIER, bytecode);

      // Unique Wallets
      expect(aliceWallet).to.not.equal(eveWallet);

      // Balances
      expect(await usdMock.balanceOf(aliceAddress)).to.equal(_100_000);
      expect(await usdMock.balanceOf(eveAddress)).to.equal(_300_000);
      expect(await usdMock.balanceOf(treasuryAddress)).to.equal(_0);
      expect(await usdMock.balanceOf(aliceWallet)).to.equal(_0);
      expect(await usdMock.balanceOf(eveWallet)).to.equal(_0);

      // Alice sends USD 3000 tokens to a pre-deterministic smart-contract wallet address
      await expect(usdMock.connect(alice).transfer(aliceWallet, _3_000))
        .to.emit(usdMock, "Transfer")
        .withArgs(aliceAddress, aliceWallet, _3_000);
      expect(await usdMock.balanceOf(aliceAddress)).to.equal(_100_000.sub(_3_000));
      expect(await usdMock.balanceOf(aliceWallet)).to.equal(_3_000);

      // Eve sends USD 1000 tokens to a pre-deterministic smart-contract wallet address
      await expect(usdMock.connect(eve).transfer(eveWallet, _1_000))
        .to.emit(usdMock, "Transfer")
        .withArgs(eveAddress, eveWallet, _1_000);
      expect(await usdMock.balanceOf(eveAddress)).to.equal(_300_000.sub(_1_000));
      expect(await usdMock.balanceOf(eveWallet)).to.equal(_1_000);

      // After detecting Alice's deposit, app creates smart-wallet for Alice at the pre-determined address
      await expect(walletFactory.connect(app).createWallet(ALICE_IDENTIFIER))
        .to.emit(walletFactory, "WalletCreated")
        .withArgs(ALICE_IDENTIFIER, aliceWallet);

      // After detecting Eve's deposit, app creates smart-wallet for Eve at the pre-determined address
      await expect(walletFactory.connect(app).createWallet(EVE_IDENTIFIER))
        .to.emit(walletFactory, "WalletCreated")
        .withArgs(EVE_IDENTIFIER, eveWallet);

      // App transfers funds from Alice's smart-wallet to treasury
      await expect(walletFactory.connect(app).transferFrom(aliceWallet, usdMock.address, _3_000))
        .to.emit(usdMock, "Transfer")
        .withArgs(aliceWallet, treasuryAddress, _3_000);

      // Balances
      expect(await usdMock.balanceOf(aliceAddress)).to.equal(_100_000.sub(_3_000));
      expect(await usdMock.balanceOf(treasuryAddress)).to.equal(_3_000);
      expect(await usdMock.balanceOf(aliceWallet)).to.equal(_0);

      // App transfers funds from Eve's smart-wallet to treasury
      await expect(walletFactory.connect(app).transferFrom(eveWallet, usdMock.address, _1_000))
        .to.emit(usdMock, "Transfer")
        .withArgs(eveWallet, treasuryAddress, _1_000);

      // Final Balances
      expect(await usdMock.balanceOf(aliceAddress)).to.equal(_100_000.sub(_3_000));
      expect(await usdMock.balanceOf(eveAddress)).to.equal(_300_000.sub(_1_000));
      expect(await usdMock.balanceOf(treasuryAddress)).to.equal(_4_000);
      expect(await usdMock.balanceOf(aliceWallet)).to.equal(_0);
      expect(await usdMock.balanceOf(eveWallet)).to.equal(_0);
    });
  });
});
