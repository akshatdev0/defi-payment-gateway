import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, owner, treasury } = await getNamedAccounts();

  await deploy(CONTRACTS.walletFactory, {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [owner, treasury],
      },
    },
    log: true,
  });
};

func.tags = [CONTRACTS.walletFactory, "wallet", "factory", "defi", "payment", "gateway"];

export default func;
