const tronWeb = require("tronweb");

var WalletFactory = artifacts.require("./WalletFactory.sol");

module.exports = function (deployer) {
  const owner = "TMTGdKkfxZr4dPX8cZQoBct9awB8CMRVdW";
  const treasury = "TNQJYxt7ujpdo7xXg8DA15qBTxBSXZFp5L";
  deployer.deploy(WalletFactory, owner, treasury).then(function () {
    return console.log(
      `WalletFactory deployed at address ${tronWeb.address.fromHex(WalletFactory.address)} (${WalletFactory.address})`,
    );
  });
};
