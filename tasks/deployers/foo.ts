import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { Foo, Foo__factory } from "../../types";

task("deploy:foo").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const fooFactory: Foo__factory = await ethers.getContractFactory("Foo");
  const foo: Foo = <Foo>await fooFactory.deploy();
  await foo.deployed();
  console.log("Foo deployed to: ", foo.address);
});
