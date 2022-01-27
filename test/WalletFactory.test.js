const { keccak } = require("./shared/utilities");

var WalletFactory = artifacts.require("./WalletFactory.sol");

contract("WalletFactory", function (accounts) {
  let deployer;
  let owner;
  let treasury;
  let other;

  let walletFactory;

  const USER_IDENTIFIER_1 = keccak("1");
  const USER_IDENTIFIER_2 = keccak("2");
  const USER_IDENTIFIER_3 = keccak("68168199-96a9-4515-99b8-7ef44f13d209");
  const USER_IDENTIFIER_4 = keccak("c98b6212-80aa-470c-9741-e427e0cdda80");

  before(async function () {
    if (accounts.length < 3) {
      // Set your own accounts if you are not using Tron Quickstart
    } else {
      deployer = accounts[0];
      owner = accounts[1];
      treasury = accounts[2];
      other = accounts[3];
    }

    console.log("Identifiers:");
    console.log("=========");
    console.log(`(1) USER_IDENTIFIER_1 : ${USER_IDENTIFIER_1} = "1"`);
    console.log(`(1) USER_IDENTIFIER_2 : ${USER_IDENTIFIER_2} = "2"`);
    console.log(`(1) USER_IDENTIFIER_3 : ${USER_IDENTIFIER_3} = "68168199-96a9-4515-99b8-7ef44f13d209"`);
    console.log(`(1) USER_IDENTIFIER_4 : ${USER_IDENTIFIER_4} = "c98b6212-80aa-470c-9741-e427e0cdda80"`);

    console.log("");

    console.log("Accounts:");
    console.log("=========");
    console.log(`(0) Deployer : ${deployer} (${tronWeb.address.toHex(deployer)})`);
    console.log(`(1) Owner    : ${owner} (${tronWeb.address.toHex(owner)})`);
    console.log(`(2) Treasury : ${treasury} (${tronWeb.address.toHex(treasury)})`);
    console.log(`(3) Other    : ${other} (${tronWeb.address.toHex(other)})`);

    walletFactory = await WalletFactory.deployed();
    console.log(
      `WalletFactory Deployed at address ${tronWeb.address.fromHex(walletFactory.address)} (${walletFactory.address})`,
    );
  });

  it("should verify that there are at least three available accounts", async function () {
    if (accounts.length < 3) {
      console.info(
        '\nYOUR ATTENTION, PLEASE.]\nTo test with 3 ore more accounts, you should use Tron Quickstart (https://github.com/tronprotocol/docker-tron-quickstart) as your private network.\nAlternatively, you must set your own accounts in the "before" statement".\n',
      );
    }
    assert.isTrue(accounts.length >= 3);
  });

  it("should verify that the contract has the correct owner", async function () {
    const actual = await walletFactory.owner();
    assert.equal(tronWeb.address.fromHex(actual), "TMTGdKkfxZr4dPX8cZQoBct9awB8CMRVdW");
  });

  it("should verify that the contract has the correct treasury", async function () {
    const actual = await walletFactory.treasury();
    assert.equal(tronWeb.address.fromHex(actual), "TNQJYxt7ujpdo7xXg8DA15qBTxBSXZFp5L");
  });
});
