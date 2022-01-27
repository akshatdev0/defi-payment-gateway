import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";

import "solidity-coverage";

import "./tasks/accounts";
import "./tasks/clean";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chains = {
  ethmainnet: "eth/mainnet",
  ethgoerli: "eth/goerli",
  ethkovan: "eth/kovan",
  ethrinkeby: "eth/rinkeby",
  ethropsten: "eth/ropsten",
  bscmainnet: "bsc/mainnet",
  bsctestnet: "bsc/testnet",
  polygonmainnet: "polygon/mainnet",
  polygonmumbai: "polygon/mumbai",
};

const chainIds = {
  ganache: 1337,
  hardhat: 31337,
  ethmainnet: 1,
  ethgoerli: 5,
  ethkovan: 42,
  ethrinkeby: 4,
  ethropsten: 3,
  bscmainnet: 56,
  bsctestnet: 97,
};

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
const moralisApiKey: string | undefined = process.env.MORALIS_API_KEY;

function getInfuraChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
  if (network === "ganache" || network === "hardhat" || !network.startsWith("eth")) {
    throw new Error(`Infura does not support '${network}' network.`);
  }
  if (!infuraApiKey) {
    throw new Error("Please set your INFURA_API_KEY in a .env file");
  }
  const url: string = "https://" + network + ".infura.io/v3/" + infuraApiKey;
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url,
  };
}

function getMoralisChainConfig(network: keyof typeof chainIds, isArchive: boolean = false): NetworkUserConfig {
  if (network === "ganache" || network === "hardhat" || !(network.startsWith("eth") || network.startsWith("bsc"))) {
    throw new Error(`Infura does not support '${network}' network.`);
  }
  if (!moralisApiKey) {
    throw new Error("Please set your MORALIS_API_KEY in a .env file");
  }
  const url: string =
    `https://speedy-nodes-nyc.moralis.io/${moralisApiKey}/${chains[network as keyof typeof chains]}` +
    (isArchive ? "/archive" : "");
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
      // See https://github.com/sc-forks/solidity-coverage/issues/652
      hardfork: process.env.CODE_COVERAGE ? "berlin" : "london",
    },
    ethgoerli: getInfuraChainConfig("ethgoerli"),
    ethkovan: getMoralisChainConfig("ethkovan"),
    ethrinkeby: getMoralisChainConfig("ethrinkeby"),
    ethropsten: getMoralisChainConfig("ethropsten"),
    bscmainnet: getMoralisChainConfig("bscmainnet"),
    bsctestnet: getMoralisChainConfig("bsctestnet"),
  },
  paths: {
    artifacts: "./build",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deploy: "./scripts/deploy",
    deployments: "./deployments",
  },
  solidity: {
    version: "0.8.6",
    settings: {
      // metadata: {
      // Not including the metadata hash
      // https://github.com/paulrberg/solidity-template/issues/31
      // bytecodeHash: "none",
      // },
      evmVersion: "istanbul",
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 999999,
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    owner: {
      default: process.env.OWNER || 1,
    },
    treasury: {
      default: process.env.TREASURY || 2,
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  abiExporter: {
    path: "./abis",
    runOnCompile: true,
    clear: true,
    flat: false,
    spacing: 2,
  },
};

export default config;
