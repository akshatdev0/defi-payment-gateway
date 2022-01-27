# DeFi Payment Gateway on TRON

## Usage

### Pre Requisites

Before running any command, you need to create a `.env.tron` file and set a private key.

Follow the example in `.env.tron.example`.

Then, proceed with installing dependencies:

```sh
yarn install
```

### Compile

Compile the smart contracts with TronBox:

```sh
$ yarn compile
```

### Deploy

Deploy the contracts to Tron Nile Testnet Network:

```sh
$ source .env.tron && ./node_modules/.bin/tronbox migrate -f 2 --reset --network nile
```

Deploy the contracts to Tron Mainnet Network:

```sh
$ source .env.tron && ./node_modules/.bin/tronbox migrate -f 2 --reset --network mainnet
```

### Tron Testing

Uses Tron Quickstart for testing:

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

Now, Run the Mocha tests:

```sh
$ yarn test

```

_Note: Only AddressGeneration test is executed for TRON._

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
