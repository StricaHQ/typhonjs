import BigNumber from "bignumber.js";
import { expect } from "chai";
import {
  utils,
  address as CardanoAddress,
  Transaction,
  types,
  PlutusDataFactory,
} from "../src/index";
import { PlutusData } from "../src/types";
import * as stub from "./stub";

describe("Typhonjs", (): void => {
  before(async () => {});

  describe("utils", () => {
    describe("PreBabbageEraMinUTXO", () => {
      it("calculate minUtxo without tokens", () => {
        const tokens = [];
        const minUtxo = utils.calculateMinUtxoAmount(tokens, stub.pParams.lovelacePerUtxoWord);
        expect(minUtxo.toNumber()).eq(999978);
      });

      it("calculate minUtxo with tokens", () => {
        const tokens = stub.tokens;
        const minUtxo = utils.calculateMinUtxoAmount(tokens, stub.pParams.lovelacePerUtxoWord);
        expect(minUtxo.toNumber()).eq(1930992);
      });

      it("calculate minUtxo without tokens with hash", () => {
        const tokens = [];
        const minUtxo = utils.calculateMinUtxoAmount(
          tokens,
          stub.pParams.lovelacePerUtxoWord,
          true
        );
        expect(minUtxo.toNumber()).eq(1344798);
      });

      it("calculate minUtxo with tokens with hash", () => {
        const tokens = stub.tokens;
        const minUtxo = utils.calculateMinUtxoAmount(
          tokens,
          stub.pParams.lovelacePerUtxoWord,
          true
        );
        expect(minUtxo.toNumber()).eq(2275812);
      });

      it("empty asset name contributes 0 bytes to sumAssetNameLengths", () => {
        const tokens = [
          {
            policyId: "30aa65f5efa96eaf3bc9a3e76ff47c6eac6472f908d6591f93e329fe",
            assetName: "", // 0-character name — hex-encoded empty string
            amount: new BigNumber(1),
          },
        ];
        const minUtxo = utils.calculateMinUtxoAmount(tokens, stub.pParams.lovelacePerUtxoWord);
        expect(minUtxo.toNumber()).eq(1310316);
      });

      it("same asset name under multiple policies is counted per policy", () => {
        const sharedAssetName = "4142434445464748"; // 8-byte hex-encoded name
        const tokens = [
          {
            policyId: "30aa65f5efa96eaf3bc9a3e76ff47c6eac6472f908d6591f93e329fe",
            assetName: sharedAssetName,
            amount: new BigNumber(1),
          },
          {
            policyId: "d070f6b0e45fc3cd280e21fd4fcac4d59b3d35b23387eb6559455879",
            assetName: sharedAssetName, // same name, different policy
            amount: new BigNumber(1),
          },
        ];
        const minUtxo = utils.calculateMinUtxoAmount(tokens, stub.pParams.lovelacePerUtxoWord);
        expect(minUtxo.toNumber()).eq(1551690);
      });
    });

    describe("Babbage Era Min UTXO", () => {
      it("calculate minUtxo with inline plutusDatum", () => {
        const minUtxo = utils.calculateMinUtxoAmountBabbage(
          {
            address: utils.getAddressFromHex(
              Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              )
            ),
            amount: new BigNumber(10),
            tokens: [],
            plutusData: stub.plutusDataD1,
          },
          stub.pParams.utxoCostPerByte
        );
        expect(minUtxo.toNumber()).eq(1978290);
      });

      it("calculate minUtxo with inline refScript", () => {
        const minUtxo = utils.calculateMinUtxoAmountBabbage(
          {
            address: utils.getAddressFromHex(
              Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              )
            ),
            amount: new BigNumber(1000000),
            tokens: [],
            plutusScript: stub.plutusScriptV2S1,
          },
          stub.pParams.utxoCostPerByte
        );
        expect(minUtxo.toNumber()).eq(8236410);
      });

      it("calculate minUtxo with tokens with inline plutusDatum", () => {
        const tokens = stub.tokens;
        const minUtxo = utils.calculateMinUtxoAmountBabbage(
          {
            address: utils.getAddressFromHex(
              Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              )
            ),
            amount: new BigNumber(10),
            tokens,
            plutusData: stub.plutusDataD1,
          },
          stub.pParams.utxoCostPerByte
        );
        expect(minUtxo.toNumber()).eq(2659270);
      });

      it("calculate minUtxo without tokens", () => {
        const tokens = [];
        const minUtxo = utils.calculateMinUtxoAmountBabbage(
          {
            address: utils.getAddressFromHex(
              Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              )
            ),
            amount: new BigNumber(10),
            tokens,
          },
          stub.pParams.utxoCostPerByte
        );
        expect(minUtxo.toNumber()).eq(961130);
      });

      it("calculate minUtxo with tokens", () => {
        const tokens = [stub.tokens[0]];
        const minUtxo = utils.calculateMinUtxoAmountBabbage(
          {
            address: utils.getAddressFromHex(
              Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              )
            ),
            amount: new BigNumber(45000000000000000),
            tokens,
          },
          stub.pParams.utxoCostPerByte
        );
        expect(minUtxo.toNumber()).eq(1232660);
      });

      it("calculate minUtxo without tokens with hash", () => {
        const tokens = [];
        const minUtxo = utils.calculateMinUtxoAmountBabbage(
          {
            address: utils.getAddressFromHex(
              Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              )
            ),
            amount: new BigNumber(10),
            tokens,
            plutusDataHash: "0000000000000000000000000000000000000000000000000000000000000000",
          },
          stub.pParams.utxoCostPerByte
        );
        expect(minUtxo.toNumber()).eq(1120600);
      });

      it("calculate minUtxo with tokens with hash", () => {
        const tokens = stub.tokens;
        const minUtxo = utils.calculateMinUtxoAmountBabbage(
          {
            address: utils.getAddressFromHex(
              Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              )
            ),
            amount: new BigNumber(10),
            tokens,
            plutusDataHash: "0000000000000000000000000000000000000000000000000000000000000000",
          },
          stub.pParams.utxoCostPerByte
        );
        expect(minUtxo.toNumber()).eq(1801580);
      });
    });

    it("get address from hex", () => {
      const address = utils.getAddressFromHex(
        Buffer.from(
          "015bb58d4a68a9504ce141aa4bff3aaceee0824434399ee56dc18ddf5a92bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b",
          "hex"
        )
      );
      expect(address instanceof CardanoAddress.BaseAddress).to.eq(true);
    });

    it("get address from bech32", () => {
      const address = utils.getAddressFromString(
        "addr1q9dmtr22dz54qn8pgx4yhle64nhwpqjyxsueaetdcxxa7k5jhh20yrgtl00c5mqnpjm5p8aud9cqldgwf3rq8dxvgy4snhadga"
      );
      expect(address instanceof CardanoAddress.BaseAddress).to.eq(true);
    });

    it("decode bech32", () => {
      const decoded = utils.decodeBech32(
        "addr1q9dmtr22dz54qn8pgx4yhle64nhwpqjyxsueaetdcxxa7k5jhh20yrgtl00c5mqnpjm5p8aud9cqldgwf3rq8dxvgy4snhadga"
      );

      expect(decoded.prefix).to.eq("addr");
      expect(decoded.value.toString("hex")).to.eq(
        "015bb58d4a68a9504ce141aa4bff3aaceee0824434399ee56dc18ddf5a92bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b"
      );
    });

    it("create metadata cbor", () => {
      const metadata: types.Metadata = {
        label: 300,
        data: "Ashish",
      };
      const auxDataCbor = utils.createAuxiliaryDataCbor({ metadata: [metadata] }).toString("hex");
      expect(auxDataCbor).to.eq("d90103a100a119012c66417368697368");
    });

    it("create plutusData cbor", () => {
      const plutusData: types.PlutusDataConstructor = {
        constructor: 0,
        fields: [12, 12],
      };
      const plutusDataCbor = utils.createPlutusDataCbor(plutusData).toString("hex");
      expect(plutusDataCbor).to.eq("d8799f0c0cff");
    });

    it("can encode PlutusData BigNumber", () => {
      const data: PlutusData = new BigNumber(42);
      const cborData = new PlutusDataFactory(data).cbor().toString("hex");
      expect(cborData).eq("182a");
    });
  });

  describe("address", () => {
    describe(`Enterprise Address`, () => {
      const adr = "addr1v8s64t9zghl44sewflpszrfx4jqc7mppd8hgp2ctakuqpaq3k5f9m";
      const address = utils.getAddressFromString(adr) as CardanoAddress.EnterpriseAddress;
      const hex = address.getHex();
      const paymentHash = address.paymentCredential.hash;
      const hashType = address.paymentCredential.type;
      const generatedAdr = new CardanoAddress.EnterpriseAddress(address.getNetworkId(), {
        hash: paymentHash,
        type: hashType,
      });

      it("hex", () => {
        expect(hex).to.eq("61e1aaaca245ff5ac32e4fc3010d26ac818f6c2169ee80ab0bedb800f4");
      });

      it("paymentHash", () => {
        expect(paymentHash.toString("hex")).to.eq(
          "e1aaaca245ff5ac32e4fc3010d26ac818f6c2169ee80ab0bedb800f4"
        );
      });
      it("paymentHash type", () => {
        expect(hashType).to.eq(types.HashType.ADDRESS);
      });

      it("address instance type", () => {
        expect(address instanceof CardanoAddress.EnterpriseAddress).to.eq(true);
      });

      it("network Id", () => {
        expect(address.getNetworkId()).eq(types.NetworkId.MAINNET);
      });

      it("create address", () => {
        expect(generatedAdr.getBech32()).to.eq(
          "addr1v8s64t9zghl44sewflpszrfx4jqc7mppd8hgp2ctakuqpaq3k5f9m"
        );
      });
    });
    describe(`Base Address`, () => {
      const adr =
        "addr1q9dmtr22dz54qn8pgx4yhle64nhwpqjyxsueaetdcxxa7k5jhh20yrgtl00c5mqnpjm5p8aud9cqldgwf3rq8dxvgy4snhadga";
      const address = utils.getAddressFromString(adr) as CardanoAddress.BaseAddress;
      const hex = address.getHex();
      const paymentHash = address.paymentCredential.hash;
      const hashType = address.paymentCredential.type;
      const stakeHash = address.stakeCredential.hash;
      const stakeHashType = address.stakeCredential.type;
      const generatedAdr = new CardanoAddress.BaseAddress(
        address.getNetworkId(),
        {
          hash: paymentHash,
          type: hashType,
        },
        {
          hash: stakeHash,
          type: stakeHashType,
        }
      );

      it("hex", () => {
        expect(hex).to.eq(
          "015bb58d4a68a9504ce141aa4bff3aaceee0824434399ee56dc18ddf5a92bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b"
        );
      });

      it("paymentHash", () => {
        expect(paymentHash.toString("hex")).to.eq(
          "5bb58d4a68a9504ce141aa4bff3aaceee0824434399ee56dc18ddf5a"
        );
      });
      it("paymentHash type", () => {
        expect(hashType).to.eq(types.HashType.ADDRESS);
      });

      it("stakeHash", () => {
        expect(stakeHash.toString("hex")).to.eq(
          "92bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b"
        );
      });
      it("stakeHash type", () => {
        expect(stakeHashType).to.eq(types.HashType.ADDRESS);
      });

      it("address instance type", () => {
        expect(address instanceof CardanoAddress.BaseAddress).to.eq(true);
      });

      it("network Id", () => {
        expect(address.getNetworkId()).eq(types.NetworkId.MAINNET);
      });

      it("create address", () => {
        expect(generatedAdr.getBech32()).to.eq(
          "addr1q9dmtr22dz54qn8pgx4yhle64nhwpqjyxsueaetdcxxa7k5jhh20yrgtl00c5mqnpjm5p8aud9cqldgwf3rq8dxvgy4snhadga"
        );
      });
    });
    describe(`Reward Address`, () => {
      const adr = "stake1uxftm48jp59lhhu2dsfsed6qn77xjuq0k58yc3srknxyz2ct9x80q";
      const address = utils.getAddressFromString(adr) as CardanoAddress.RewardAddress;
      const hex = address.getHex();
      const stakeHash = address.stakeCredential.hash;
      const stakeHashType = address.stakeCredential.type;
      const generatedAdr = new CardanoAddress.RewardAddress(address.getNetworkId(), {
        hash: stakeHash,
        type: stakeHashType,
      });

      it("hex", () => {
        expect(hex).to.eq("e192bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b");
      });

      it("stakeHash", () => {
        expect(stakeHash.toString("hex")).to.eq(
          "92bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b"
        );
      });
      it("stakeHash type", () => {
        expect(stakeHashType).to.eq(types.HashType.ADDRESS);
      });

      it("address instance type", () => {
        expect(address instanceof CardanoAddress.RewardAddress).to.eq(true);
      });

      it("network Id", () => {
        expect(address.getNetworkId()).eq(types.NetworkId.MAINNET);
      });

      it("create address", () => {
        expect(generatedAdr.getBech32()).to.eq(
          "stake1uxftm48jp59lhhu2dsfsed6qn77xjuq0k58yc3srknxyz2ct9x80q"
        );
      });
    });
  });

  describe("transaction", () => {
    describe("fees", () => {
      it("calculates fees with inline ref script", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [],
          plutusScript: stub.plutusScriptV2S1,
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(242413);
      });

      it("calculates fees with inline plutusData", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [],
          plutusData: stub.plutusDataD1,
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(188865);
      });

      it("calculates correct fees", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [],
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(168317);
      });

      it("calculates correct fees with tokens", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [stub.tokens[0]],
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(176941);
      });

      it("calculates correct fees with plutusDataHash", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [],
          plutusDataHash: "323106803df714be488266c6cd0464e3dcefac9dc7076a34de8a95bff1967d92",
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(169945);
      });

      it("calculates correct fees with plutusDataHash & token", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [stub.tokens[0]],
          plutusDataHash: "323106803df714be488266c6cd0464e3dcefac9dc7076a34de8a95bff1967d92",
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(178569);
      });

      it("calculates correct fees with inline plutusData & token", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [stub.tokens[0]],
          plutusData: stub.plutusDataD1,
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(197489);
      });

      it("calculates correct fees with donation & treasury amount", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [],
        };
        const tx = new Transaction({ protocolParams: stub.pParams });

        tx.setDonationAmount(new BigNumber(1000000));
        tx.setTreasuryAmount(new BigNumber(2000000));
        tx.setTTL(3000000);
        tx.addOutput(output);

        tx.prepareTransaction({
          inputs: stub.UTXOs,
          changeAddress: stub.changeAddress,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(168845);
      });
    });

    describe("utxo selection", () => {
      describe("utxo selection scenario 1", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [],
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const pickedUpUtxos = tx.getInputs();

        it("inputs count", () => {
          expect(pickedUpUtxos.length).to.eq(1);
        });

        it("selected inputs", () => {
          expect(pickedUpUtxos[0].txId).to.eq(
            "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13314"
          );
        });
      });

      describe("utxo selection scenario 2", () => {
        const output: types.Output = {
          amount: new BigNumber(55000000),
          address: stub.receiverAddress,
          tokens: [],
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const pickedUpUtxos = tx.getInputs();

        it("inputs count", () => {
          expect(pickedUpUtxos.length).to.eq(2);
        });

        it("selected inputs", () => {
          expect(pickedUpUtxos[0].txId).to.eq(
            "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13314"
          );
          expect(pickedUpUtxos[1].txId).to.eq(
            "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13313"
          );
        });
      });

      describe("utxo selection scenario 3", () => {
        const output: types.Output = {
          amount: new BigNumber(10000000),
          address: stub.receiverAddress,
          tokens: [stub.tokens[0]],
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const pickedUpUtxos = tx.getInputs();

        it("inputs count", () => {
          expect(pickedUpUtxos.length).to.eq(2);
        });

        it("selected inputs", () => {
          expect(pickedUpUtxos[0].txId).to.eq(
            "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13314"
          );
          expect(pickedUpUtxos[1].txId).to.eq(
            "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13313"
          );
        });
      });
    });

    describe("outputs/change", () => {
      describe("output scenario 1 without tokens", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [],
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const outputs = tx.getOutputs();

        it("output count", () => {
          expect(outputs.length).to.eq(2);
        });

        it("receiver output", () => {
          expect(outputs[0].address.getBech32()).to.eq(stub.receiverAddress.getBech32());
          expect(outputs[0].amount.toNumber()).to.eq(output.amount.toNumber());
        });

        it("change output", () => {
          expect(outputs[1].address.getBech32()).to.eq(stub.changeAddress.getBech32());
          expect(outputs[1].amount.toNumber()).to.eq(
            stub.UTXOs[0].amount.minus(output.amount).minus(tx.getFee()).toNumber()
          );
        });
      });

      describe("output scenario 2 with tokens", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [{ ...stub.tokens[0], amount: new BigNumber(10) }],
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const outputs = tx.getOutputs();

        it("output count", () => {
          expect(outputs.length).to.eq(2);
        });

        it("receiver output", () => {
          expect(outputs[0].address.getBech32()).to.eq(stub.receiverAddress.getBech32());
          expect(outputs[0].amount.toNumber()).to.eq(output.amount.toNumber());
          expect(outputs[0].tokens[0].amount.toNumber()).to.eq(output.tokens[0].amount.toNumber());
        });

        it("change output", () => {
          expect(outputs[1].address.getBech32()).to.eq(stub.changeAddress.getBech32());
          expect(outputs[1].amount.toNumber()).to.eq(
            stub.UTXOs[0].amount
              .plus(stub.UTXOs[1].amount)
              .minus(output.amount)
              .minus(tx.getFee())
              .toNumber()
          );
          expect(outputs[1].tokens[0].amount.toNumber()).to.eq(
            stub.tokens[0].amount.minus(output.tokens[0].amount).toNumber()
          );
        });
      });

      describe("output scenario 3 remaining ADA as fees", () => {
        const output: types.Output = {
          amount: new BigNumber(49500000),
          address: stub.receiverAddress,
          tokens: [],
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: [stub.UTXOs[0]],
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const outputs = tx.getOutputs();
        it("output count", () => {
          expect(outputs.length).to.eq(1);
        });

        it("receiver output", () => {
          expect(outputs[0].address.getBech32()).to.eq(stub.receiverAddress.getBech32());
          expect(outputs[0].amount.toNumber()).to.eq(output.amount.toNumber());
        });
      });
    });

    describe("collateral fields", () => {
      const output: types.Output = {
        amount: new BigNumber(5000000),
        address: stub.receiverAddress,
        tokens: [],
      };

      const colOutput: types.Output = {
        amount: new BigNumber(8000000),
        address: stub.receiverAddress,
        tokens: [],
      };

      const tx = new Transaction({ protocolParams: stub.pParams });
      tx.addInput(stub.UTXOs[0]);
      tx.addInput(stub.UTXOs[1]);
      tx.addOutput(output);
      tx.addCollateral(stub.UTXOs[2]);
      tx.setCollateralOutput(colOutput);
      tx.setTotalCollateral(new BigNumber(30000000)); // stub 2 utxo

      tx.buildTransaction();

      it("can set collateral inputs", () => {
        const colInputs = tx.getCollaterals();

        expect(colInputs[0].txId).to.eq(stub.UTXOs[2].txId);
      });

      it("can set total collateral", () => {
        const totalCollateral = tx.getTotalCollateral();

        expect(totalCollateral?.toNumber()).to.eq(30000000);
      });

      it("can set collateral output", () => {
        const collateralOutput = tx.getCollateralOutput();

        expect(collateralOutput?.amount.toNumber()).to.eq(8000000);
        expect(collateralOutput?.address.getHex()).to.eq(stub.receiverAddress.getHex());
      });
    });

    describe("donation and treasury fields", () => {
      const output: types.Output = {
        amount: new BigNumber(5000000),
        address: stub.receiverAddress,
        tokens: [],
      };

      const tx = new Transaction({ protocolParams: stub.pParams });
      tx.addInput(stub.UTXOs[0]);
      tx.addInput(stub.UTXOs[1]);
      tx.addOutput(output);
      tx.setDonationAmount(new BigNumber(1000000));
      tx.setTreasuryAmount(new BigNumber(2000000));

      tx.buildTransaction();

      it("can set donation", () => {
        const donationAmount = tx.getDonationAmount();
        expect(donationAmount?.toNumber()).to.eq(1000000);
      });

      it("can set treasury amount", () => {
        const treasuryAmount = tx.getTreasuryAmount();
        expect(treasuryAmount?.toNumber()).to.eq(2000000);
      });
    });

    describe("proposal procedure transaction", () => {
      const output: types.Output = {
        amount: new BigNumber(5000000),
        address: stub.receiverAddress,
        tokens: [],
      };

      const tx = new Transaction({ protocolParams: stub.pParams });
      tx.addInput(stub.UTXOs[0]);
      tx.addInput(stub.UTXOs[1]);
      tx.addOutput(output);

      tx.addProposalProcedure(stub.proposalProcedure0);

      tx.buildTransaction();

      it("can set proposalProcedure", () => {
        const proposalProcedures = tx.getProposalProcedures();
        expect(proposalProcedures[0]?.govAction.type).to.eq(1);
      });

      it("has correct additional ADA requirement", () => {
        const additionalAda = tx.getAdditionalOutputAda();
        // additional 100k ADA required due to proposal deposit
        expect(additionalAda.toNumber()).to.eq(100000000000);
      });
    });

    describe("voting procedure transaction", () => {
      const output: types.Output = {
        amount: new BigNumber(5000000),
        address: stub.receiverAddress,
        tokens: [],
      };

      const tx = new Transaction({ protocolParams: stub.pParams });
      tx.addInput(stub.UTXOs[0]);
      tx.addInput(stub.UTXOs[1]);
      tx.addOutput(output);

      tx.addVotingProcedure(stub.votingProcedure0);

      tx.buildTransaction();

      it("can set votingProcedure", () => {
        const votingProcedures = tx.getVotingProcedures();
        expect(votingProcedures[0]?.voter.key.hash.toString("hex")).to.eq(
          stub.voter0.key.hash.toString("hex")
        );
        expect(votingProcedures[0]?.votes[0].govActionId.txId.toString("hex")).to.eq(
          stub.govActionId0.txId.toString("hex")
        );
      });
    });
  });
});
