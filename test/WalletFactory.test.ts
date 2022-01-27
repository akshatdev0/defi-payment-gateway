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
  let admin: Signer;
  let app: Signer;
  let treasury: Signer;
  let other: Signer;
  let authorized: Signer;

  let deployerAddress: string;
  let adminAddress: string;
  let appAddress: string;
  let treasuryAddress: string;
  let otherAddress: string;
  let authorizedAddress: string;

  let walletFactory: WalletFactory;

  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const APP_ROLE = keccak("APP_ROLE");
  const ZERO_ADDRESS = ethers.constants.AddressZero;
  const USER_IDENTIFIER_1 = keccak("1");
  const USER_IDENTIFIER_2 = keccak("2");
  const _1_000 = bigNumberify("1000000000");
  const INIT_CODE_HASH = "0x79b8071417ed7109c7e1d6474ccec39a75b4578c3a526aedd173f5536b17d0ea";

  before(async function () {
    [deployer, admin, app, treasury, other, authorized] = await ethers.getSigners();
    [deployerAddress, adminAddress, appAddress, treasuryAddress, otherAddress, authorizedAddress] = await Promise.all([
      deployer.getAddress(),
      admin.getAddress(),
      app.getAddress(),
      treasury.getAddress(),
      other.getAddress(),
      authorized.getAddress(),
    ]);
  });

  describe("initialization", () => {
    it("can be deployed and initialized only once", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
        adminAddress,
        appAddress,
        treasuryAddress,
      ])) as WalletFactory;
      await walletFactory.deployed();

      await expect(
        walletFactory.connect(deployer).initialize(adminAddress, appAddress, treasuryAddress),
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("will not allow a 0x0 admin address", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      await expect(
        upgrades.deployProxy(walletFactory__factory, [ZERO_ADDRESS, appAddress, treasuryAddress]),
      ).to.be.revertedWith("WalletFactory: new admin is the zero address");
    });

    it("will not allow a 0x0 app address", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      await expect(
        upgrades.deployProxy(walletFactory__factory, [adminAddress, ZERO_ADDRESS, treasuryAddress]),
      ).to.be.revertedWith("WalletFactory: new app is the zero address");
    });

    it("will not allow a 0x0 Treasury address", async () => {
      const walletFactory__factory = new WalletFactory__factory(deployer);
      await expect(
        upgrades.deployProxy(walletFactory__factory, [adminAddress, appAddress, ZERO_ADDRESS]),
      ).to.be.revertedWith("WalletFactory: new treasury is the zero address");
    });
  });

  describe("post-initialization", function () {
    describe("validations", function () {
      beforeEach(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          adminAddress,
          appAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("admin has the 'DEFAULT_ADMIN_ROLE'", async function () {
        expect(await walletFactory.hasRole(DEFAULT_ADMIN_ROLE, adminAddress)).to.be.true;
      });

      it("app has the 'APP_ROLE'", async function () {
        expect(await walletFactory.hasRole(APP_ROLE, appAddress)).to.be.true;
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
          expect(generatedAddress).to.be.equal("0x8CdA19052d7DF0364adebE24CA9fb14723a5D771");

          generatedAddress = getCreate2Address(walletFactory.address, USER_IDENTIFIER_2, bytecode);
          log(walletFactory.address, USER_IDENTIFIER_2, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0x30Fc161731F80f08C316B6995bfb99cCa1a3c44E");

          generatedAddress = getCreate2Address(deployerAddress, USER_IDENTIFIER_1, bytecode);
          log(deployerAddress, USER_IDENTIFIER_1, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0xe556F081634891b401b7Fe34bD1624E72AcE7BE8");

          generatedAddress = getCreate2Address(deployerAddress, USER_IDENTIFIER_2, bytecode);
          log(deployerAddress, USER_IDENTIFIER_2, INIT_CODE_HASH, generatedAddress);
          expect(generatedAddress).to.be.equal("0xc93Aa68747e99EB93f329083E55efA1C7A78142f");
        });
      });
    });

    describe("access control", function () {
      beforeEach(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          adminAddress,
          appAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      describe("default admin", function () {
        it("admin has the 'DEFAULT_ADMIN_ROLE'", async function () {
          expect(await walletFactory.hasRole(DEFAULT_ADMIN_ROLE, adminAddress)).to.equal(true);
        });

        it("other roles's admin is the 'DEFAULT_ADMIN_ROLE'", async function () {
          expect(await walletFactory.getRoleAdmin(APP_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
        });

        it("DEFAULT_ADMIN_ROLE's admin is itself", async function () {
          expect(await walletFactory.getRoleAdmin(DEFAULT_ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
        });
      });

      describe("granting", function () {
        it("admin can grant 'APP_ROLE' to other accounts", async function () {
          await expect(walletFactory.connect(admin).grantRole(APP_ROLE, authorizedAddress))
            .to.emit(walletFactory, "RoleGranted")
            .withArgs(APP_ROLE, authorizedAddress, adminAddress);
        });

        it("non-admin cannot grant 'APP_ROLE' to other accounts", async function () {
          await expect(walletFactory.connect(other).grantRole(APP_ROLE, authorizedAddress)).to.be.revertedWith(
            `AccessControl: account ${otherAddress.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
          );
        });

        it("accounts can be granted a role multiple times", async function () {
          await expect(walletFactory.connect(admin).grantRole(APP_ROLE, authorizedAddress))
            .to.emit(walletFactory, "RoleGranted")
            .withArgs(APP_ROLE, authorizedAddress, adminAddress);
          await expect(walletFactory.connect(admin).grantRole(APP_ROLE, authorizedAddress)).to.not.emit(
            walletFactory,
            "RoleGranted",
          );
        });
      });
    });

    describe("create wallet", function () {
      before(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          adminAddress,
          appAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("can only be called by app", async function () {
        await expect(walletFactory.connect(other).createWallet(USER_IDENTIFIER_1)).to.be.revertedWith(
          `AccessControl: account ${otherAddress.toLowerCase()} is missing role ${APP_ROLE}`,
        );
      });

      it("app creates a new wallet", async function () {
        const identifier = USER_IDENTIFIER_1;
        const bytecode = Wallet__factory.bytecode;
        const walletAddress = getCreate2Address(walletFactory.address, identifier, bytecode);

        await expect(walletFactory.connect(app).createWallet(identifier))
          .to.emit(walletFactory, "WalletCreated")
          .withArgs(identifier, walletAddress);
        await expect(walletFactory.connect(app).createWallet(identifier)).to.be.reverted; // WALLET_EXISTS

        const wallet = new Wallet__factory(deployer).attach(walletAddress);
        expect(await wallet.owner()).to.eq(walletFactory.address);

        await expect(wallet.connect(deployer).initialize(deployerAddress)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });

      it("app creates another new wallet", async function () {
        const identifier = USER_IDENTIFIER_2;
        const bytecode = Wallet__factory.bytecode;
        const walletAddress = getCreate2Address(walletFactory.address, identifier, bytecode);

        await expect(walletFactory.connect(app).createWallet(identifier))
          .to.emit(walletFactory, "WalletCreated")
          .withArgs(identifier, walletAddress);
        await expect(walletFactory.connect(app).createWallet(identifier)).to.be.reverted; // WALLET_EXISTS

        const wallet = new Wallet__factory(deployer).attach(walletAddress);
        expect(await wallet.owner()).to.eq(walletFactory.address);

        await expect(wallet.connect(deployer).initialize(deployerAddress)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });
    });

    describe("update treasury", function () {
      beforeEach(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          adminAddress,
          appAddress,
          treasuryAddress,
        ])) as WalletFactory;
        await walletFactory.deployed();
      });

      it("changes treasury after update", async function () {
        await expect(walletFactory.connect(admin).updateTreasury(otherAddress))
          .to.emit(walletFactory, "TreasuryUpdated")
          .withArgs(treasuryAddress, otherAddress);
        expect(await walletFactory.treasury()).to.equal(otherAddress);
      });

      it("prevents non-owners from updating", async function () {
        await expect(walletFactory.connect(deployer).updateTreasury(otherAddress)).to.be.revertedWith(
          `AccessControl: account ${deployerAddress.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
        );
        await expect(walletFactory.connect(app).updateTreasury(otherAddress)).to.be.revertedWith(
          `AccessControl: account ${appAddress.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
        );
        await expect(walletFactory.connect(treasury).updateTreasury(otherAddress)).to.be.revertedWith(
          `AccessControl: account ${treasuryAddress.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
        );
        await expect(walletFactory.connect(other).updateTreasury(otherAddress)).to.be.revertedWith(
          `AccessControl: account ${otherAddress.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
        );
        await expect(walletFactory.connect(authorized).updateTreasury(otherAddress)).to.be.revertedWith(
          `AccessControl: account ${authorizedAddress.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
        );
      });

      it("guards treasury against stuck state", async function () {
        await expect(walletFactory.connect(admin).updateTreasury(ZERO_ADDRESS)).to.be.revertedWith(
          "WalletFactory: new treasury is the zero address",
        );
      });
    });

    describe("transfer from", function () {
      let usdFake: FakeContract<USD>;

      beforeEach(async function () {
        const walletFactory__factory = new WalletFactory__factory(deployer);
        walletFactory = (await upgrades.deployProxy(walletFactory__factory, [
          adminAddress,
          appAddress,
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
        ).to.be.revertedWith(`AccessControl: account ${deployerAddress.toLowerCase()} is missing role ${APP_ROLE}`);
        await expect(
          walletFactory.connect(admin).transferFrom(walletAddress, usdFake.address, _1_000),
        ).to.be.revertedWith(`AccessControl: account ${adminAddress.toLowerCase()} is missing role ${APP_ROLE}`);
        await expect(
          walletFactory.connect(treasury).transferFrom(walletAddress, usdFake.address, _1_000),
        ).to.be.revertedWith(`AccessControl: account ${treasuryAddress.toLowerCase()} is missing role ${APP_ROLE}`);
        await expect(
          walletFactory.connect(other).transferFrom(walletAddress, usdFake.address, _1_000),
        ).to.be.revertedWith(`AccessControl: account ${otherAddress.toLowerCase()} is missing role ${APP_ROLE}`);
        await expect(
          walletFactory.connect(authorized).transferFrom(walletAddress, usdFake.address, _1_000),
        ).to.be.revertedWith(`AccessControl: account ${authorizedAddress.toLowerCase()} is missing role ${APP_ROLE}`);
      });
    });
  });
});
