import { ethers } from "hardhat";
import { Signer } from "ethers";
import chai, { expect } from "chai";
import { FakeContract, smock } from "@defi-wonderland/smock";

import { USD, USD__factory, Wallet, Wallet__factory } from "../types";
import { bigNumberify } from "./shared/utilities";

chai.use(smock.matchers);

describe("Wallet Unit Tests", function () {
  // Accounts
  let deployer: Signer;
  let owner: Signer;
  let other: Signer;

  let ownerAddress: string;
  let otherAddress: string;

  let wallet: Wallet;

  const ZERO_ADDRESS = ethers.constants.AddressZero;
  const _1_000 = bigNumberify("1000000000");

  before(async function () {
    [deployer, owner, other] = await ethers.getSigners();
    [ownerAddress, otherAddress] = await Promise.all([owner.getAddress(), other.getAddress()]);
  });

  describe("initialization", () => {
    it("can be deployed and initialized only once", async () => {
      wallet = await new Wallet__factory(deployer).deploy();
      await wallet.deployed();

      await wallet.connect(deployer).initialize(ownerAddress);

      await expect(wallet.connect(deployer).initialize(ownerAddress)).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });

    it("will not allow a 0x0 Owner address", async () => {
      wallet = await new Wallet__factory(deployer).deploy();
      await wallet.deployed();

      await expect(wallet.connect(deployer).initialize(ZERO_ADDRESS)).to.be.revertedWith(
        "Ownable: new owner is the zero address",
      );
    });
  });

  describe("post-initialization", function () {
    beforeEach(async function () {
      wallet = await new Wallet__factory(deployer).deploy();
      await wallet.deployed();
      await wallet.connect(deployer).initialize(ownerAddress);
    });

    describe("validations", function () {
      it("has an owner", async function () {
        expect(await wallet.owner()).to.equal(ownerAddress);
      });
    });

    describe("transfer ownership", function () {
      it("changes owner after transfer", async function () {
        await expect(wallet.connect(owner).transferOwnership(otherAddress))
          .to.emit(wallet, "OwnershipTransferred")
          .withArgs(ownerAddress, otherAddress);
        expect(await wallet.owner()).to.equal(otherAddress);
      });

      it("prevents non-owners from transferring", async function () {
        await expect(wallet.connect(deployer).transferOwnership(otherAddress)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
        await expect(wallet.connect(other).transferOwnership(otherAddress)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("guards ownership against stuck state", async function () {
        await expect(wallet.connect(owner).transferOwnership(ZERO_ADDRESS)).to.be.revertedWith(
          "Ownable: new owner is the zero address",
        );
      });
    });

    describe("transfer", function () {
      let usdFake: FakeContract<USD>;

      beforeEach(async function () {
        const usd__factory = new USD__factory(deployer);
        usdFake = await smock.fake(usd__factory);
      });

      it("prevents non-owners from transferring", async function () {
        await expect(wallet.connect(deployer).transfer(usdFake.address, otherAddress, _1_000)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
        await expect(wallet.connect(other).transfer(usdFake.address, otherAddress, _1_000)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("can only be called by owner", async function () {
        await expect(wallet.connect(owner).transfer(usdFake.address, otherAddress, _1_000)).to.not.be.reverted;
      });
    });
  });
});
