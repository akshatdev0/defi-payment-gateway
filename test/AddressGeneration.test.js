const { keccak, keccak256, getCreate2TronAddress } = require("./shared/utilities");

var Wallet = artifacts.require("./Wallet.sol");

contract("Address Generation", function (accounts) {
  const USER_IDENTIFIER_1 = keccak("1");
  const USER_IDENTIFIER_2 = keccak("2");
  const USER_IDENTIFIER_3 = keccak("68168199-96a9-4515-99b8-7ef44f13d209");
  const USER_IDENTIFIER_4 = keccak("c98b6212-80aa-470c-9741-e427e0cdda80");

  const INIT_CODE_HASH = "0xa800a84a1e76d9ebed54ef4780c3213798df585d5fa31cb9beb636eccb0a97f8";

  it("generates correct addresses", async () => {
    const factoryAddress = "TAtb9skGf5JU62NKYPY1G8THDWV9T7mx53";
    const nileFactoryAddress = "TCX2uhV4HjcWRB7hrTQL57fFRdxgiyypEc";
    const bytecode = Wallet.bytecode;
    const initCodeHash = keccak256(bytecode);
    let generatedAddress;

    const log = (sender, salt, initCodeHash, generatedAddress) => {
      console.log("");
      console.log("Inputs:");
      console.log(`- sender            : ${sender}`);
      console.log(`- salt              : ${salt}`);
      console.log(`- init_code_hash    : ${initCodeHash}`);
      console.log("Outputs:");
      console.log(`- generated_address : ${generatedAddress}`);
      console.log("");
    };

    assert.equal(initCodeHash, INIT_CODE_HASH);

    generatedAddress = getCreate2TronAddress(factoryAddress, USER_IDENTIFIER_1, bytecode);
    log(factoryAddress, USER_IDENTIFIER_1, INIT_CODE_HASH, generatedAddress);
    assert.equal(generatedAddress, "TTugLVdaFLYUZ5CdzUpu2LppMF55RAurWy");

    generatedAddress = getCreate2TronAddress(factoryAddress, USER_IDENTIFIER_2, bytecode);
    log(factoryAddress, USER_IDENTIFIER_2, INIT_CODE_HASH, generatedAddress);
    assert.equal(generatedAddress, "TKPqvci1TwVkkJatoQcboso2Jw6tNdUryn");

    generatedAddress = getCreate2TronAddress(nileFactoryAddress, USER_IDENTIFIER_3, bytecode);
    log(nileFactoryAddress, USER_IDENTIFIER_3, INIT_CODE_HASH, generatedAddress);
    assert.equal(generatedAddress, "TQuCvgU5njYMhnL47ajAoqhMZirqtQiph9");

    generatedAddress = getCreate2TronAddress(nileFactoryAddress, USER_IDENTIFIER_4, bytecode);
    log(nileFactoryAddress, USER_IDENTIFIER_4, INIT_CODE_HASH, generatedAddress);
    assert.equal(generatedAddress, "TEXYFRCmwbbyyuJG1djHanic1nNSFhspWP");
  });
});
