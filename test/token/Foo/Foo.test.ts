import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { Foo } from "../../../types/Foo";
import { Foo__factory } from "../../../types";

describe("Foo Token Unit tests", function () {
  let admin: SignerWithAddress;
  let foo: Foo;

  const name = "Foo";
  const symbol = "FOO";

  before(async function () {
    [admin] = await ethers.getSigners();
  });

  describe("Foo", function () {
    beforeEach(async function () {
      foo = await new Foo__factory(admin).deploy();
    });

    it("has a name", async function () {
      expect(await foo.connect(admin).name()).to.equal(name);
    });

    it("has a symbol", async function () {
      expect(await foo.connect(admin).symbol()).to.equal(symbol);
    });

    it("has 18 decimals", async function () {
      expect(await foo.connect(admin).decimals()).to.equal(18);
    });

    it("has total supply of", async function () {
      expect(await foo.connect(admin).totalSupply()).to.equal("100000000000");
    });
  });
});
