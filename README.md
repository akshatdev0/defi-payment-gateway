# Solidity Template

My favourite setup for writing Solidity smart contracts.

- [Hardhat](https://github.com/nomiclabs/hardhat): compile and run the smart contracts on a local development network
- [TypeChain](https://github.com/ethereum-ts/TypeChain): generate TypeScript types for smart contracts
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation
- [Waffle](https://github.com/EthWorks/Waffle): tooling for writing comprehensive smart contract tests
- [Solhint](https://github.com/protofire/solhint): linter
- [Solcover](https://github.com/sc-forks/solidity-coverage): code coverage
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity): code formatter

This is a GitHub template, which means you can reuse it as many times as you want. You can do that by clicking the "Use this
template" button at the top of the page.

## Usage

### Pre Requisites

Before running any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploy

Deploy the contracts to Hardhat Network:

```sh
$ yarn deploy --greeting "Bonjour, le monde!"
```

## Syntax Highlighting

If you use VSCode, you can enjoy syntax highlighting for your Solidity code via the
[vscode-solidity](https://github.com/juanfranblanco/vscode-solidity) extension. The recommended approach to set the
compiler version is to add the following fields to your VSCode user settings:

```json
{
  "solidity.compileUsingRemoteVersion": "v0.8.4+commit.c7e474f2",
  "solidity.defaultCompiler": "remote"
}
```

Where of course `v0.8.4+commit.c7e474f2` can be replaced with any other version.

### Tron Testing

Tron Quickstart sets up accounts to be used for tests with TronBox 2.1+ (10 accounts by default). Once the transactions are mined, the final output is printed out:

```
Available Accounts
==================

(0) TSMfMEWUd2pEin4Xi6hmKgcJo5DoYuxLRW (10000 TRX)
(1) TYZmquLQD1zf26nRfji3x3drjXrPQFiVEC (10000 TRX)
(2) TNhyWGFDLJCHmVYGuL38fXhKTZtDQP69RR (10000 TRX)
(3) TCXBt2Sf41vAmELNbNMjQBY5WV43cWecBf (20000 TRX)
(4) TKr387MKbfzEEJq1sctkafy1p49duU5sEd (20000 TRX)
(5) TLSkua2zPezLtYmhZyPxE1PoiSnoKZA2WR (10000 TRX)
(6) TRbcw5dhbZDA6YfCTpqCunorzfjowzhke8 (20000 TRX)
(7) TJnL5e8tyWrDDZdSRi5ANw8j3JAWPVJMqJ (20000 TRX)
(8) TKSJ6zgZy5puCKzRirH82P8Yyiy2rkfpeq (20000 TRX)
(9) TB3Je2myr8mY5ze9uJb1FvdWyjwoZRcdRm (20000 TRX)

Private Keys
==================

(0) 93152dfcea9d8d1d6e0ae09966e8a2f09fe0247d0b8290e0764674662e696a65
(1) 4766d390b5dff77cdf160eb430b509341036e064630eb3494dd4c808bc1f72f0
(2) 0fae4bf0cad796b7a9c44ef9d5d15f93901126003c002c19d3d291a853ff3901
(3) a86f57856c16c98d2f1ba147348098fa1bffb2bb8545b9879a6cb90036530d1c
(4) 0d0395a5a023cc37c5a907a34a4b1d1ea4abf0272bbeb3cc6a742b4dc0fa49ec
(5) 4d91d3fddf3096e9ffb3d2f50491ed21bbdaf82d7645e94444ed234a27cf2cff
(6) ceab9096d45a5a071dcc154979a1d348e147f7609681173ffd7780351922b8d9
(7) 7ae8863af2d8e6a79e98bd583192729b9743009baa9271aa0f82303036ca9f79
(8) e0775085be615147e37d291e684f896bd3fba5637af8fe7ce4a966b9f0215d0c
(9) 7c20a045dab3c77faaa0b7662e2d7f84b6e1768d1a7bedf5c6fabc4f2c1ad709

HD Wallet
==================
Mnemonic:      treat nation math panel calm spy much obey moral hazard they sorry
Base HD Path:  m/44'/60'/0'/0{account_index}
```

#### Quickstart options:

Use `-e` flag to pass environmental variables to the docker.
Example:

```
docker run -it \
  -p 9090:9090 \
  --rm \
  --name tron \
  -e "mnemonic=treat nation math panel calm spy much obey moral hazard they sorry" \
  -e "hdPath=m/44'/60'/0'/0" \
  trontools/quickstart
```

**List of options:**

- `accounts=12` sets the number of generated accounts
- `useDefaultPrivateKey=true` tells Quickstart to use the default account as `accounts[0]`
- `mnemonic=wrong bit chicken kitchen rat` uses a specified mnemonic
- `defaultBalance=100000` sets the initial balance for the generated accounts (in the example to 100,000 TRX)
- `seed=ushwe63hgeWUS` sets the seed to be used to generate the mnemonic (if none is passed)
- `hdPath=m/44'/60'/0'/0` sets a custom bit39 hdPath
- `formatJson=true` formats the output
- `preapprove=...` pre approved proposals (see below for more help)

### Bandwidth & Energy Consumption

1. WalletFactory Deployment

```
  A) Running migration: 1_initial_migration.js
   - Bandwidth : 957
   - Energy    : 114,068

  B) Saving successful migration to network...
   - Bandwidth : 314
   - Energy    : 20,369

  C) Running migration: 2_deploy_wallet_factory.js
   - Bandwidth : 5,934
   - Energy    : 932,022

  D) Saving successful migration to network...
   - Bandwidth : 314
   - Energy    : 20,369

  TOTAL:
  Bandwidth = 7,519
  Energy    = 1,086,828
```

2. User Smart-Wallet Creation

```
  Bandwidth = 314
  Energy    = 454,347
```

3. Smart-Wallet Token Withdrawal to Treasury

```
  Bandwidth = 379
  Energy    = 30,288
```
