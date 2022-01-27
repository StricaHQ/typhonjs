<p align="center">
  <a href="https://strica.io/" target="_blank">
    <img src="https://docs.strica.io/images/logo.png" width="200">
  </a>
</p>

# @stricahq/typhonjs

Pure javascript Cardano wallet library.

- Generate and work with Cardano addresses
- Build complex transactions
- Automatic UTXO selection
- Metadata support
- Plutus support
- and much more

## Installation

### yarn/npm

```sh
yarn add @stricahq/typhonjs
```
### Browser

```html
<script src="[use jsDelivr or Unpkg]"></script>

// access typhonjs global variable
```

## Key generation & Signing

Use [@stricahq/bip32ed25519](https://github.com/StricaHQ/bip32ed25519) for deriving keys and signing transaction with mnemonics

```js
// see tests for building `transaction`
const txHash = transaction.getTransactionHash();
const requiredSignatures = transaction.getRequiredWitnesses();

// `accountPrivateKey` derive using @stricahq/bip32ed25519
for (const [, bipPath] of requiredSignatures) {
  const privateKey = accountPrivateKey.derive(bipPath.chain).derive(bipPath.index).toPrivateKey();
  const witness = {
    publicKey: privateKey.toPublicKey().toBytes(),
    signature: privateKey.sign(txHash),
  };
  transaction.addWitness(witness);
}
```

## Usage Example

Checkout tests and API doc

## API Doc

Find the API documentation [here](https://docs.strica.io/lib/typhonjs)

## Used by

[Typhon Wallet](https://typhonwallet.io)

# License

Copyright 2022 Strica

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
