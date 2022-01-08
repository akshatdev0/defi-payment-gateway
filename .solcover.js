const shell = require("shelljs");

// The environment variables are loaded in hardhat.config.ts
const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

module.exports = {
  istanbulReporter: ["html", "lcov"],
  onCompileComplete: async function (_config) {
    await run("types");
  },
  onIstanbulComplete: async function (_config) {
    // We need to do this because solcover generates bespoke artifacts.
    shell.rm("-rf", "./artifacts");
    shell.rm("-rf", "./types");
  },
  providerOptions: {
    mnemonic,
  },
  skipFiles: ["mocks", "test"],
};
