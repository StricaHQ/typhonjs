import BigNumber from "bignumber.js";
import { expect } from "chai";
import { utils, address as CardanoAddress, Transaction, types } from "../src/index";
import * as stub from "./stub";

describe("Typhonjs", (): void => {
  before(async () => {});

  describe("utils", () => {
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
      const minUtxo = utils.calculateMinUtxoAmount(tokens, stub.pParams.lovelacePerUtxoWord, true);
      expect(minUtxo.toNumber()).eq(1344798);
    });

    it("calculate minUtxo with tokens with hash", () => {
      const tokens = stub.tokens;
      const minUtxo = utils.calculateMinUtxoAmount(tokens, stub.pParams.lovelacePerUtxoWord, true);
      expect(minUtxo.toNumber()).eq(2275812);
    });

    it("get address from hex", () => {
      const address = utils.getAddressFromHex(
        "015bb58d4a68a9504ce141aa4bff3aaceee0824434399ee56dc18ddf5a92bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b"
      );
      expect(address instanceof CardanoAddress.BaseAddress).to.eq(true);
    });

    it("get address from bech32", () => {
      const address = utils.getAddressFromBech32(
        "addr1q9dmtr22dz54qn8pgx4yhle64nhwpqjyxsueaetdcxxa7k5jhh20yrgtl00c5mqnpjm5p8aud9cqldgwf3rq8dxvgy4snhadga"
      );
      expect(address instanceof CardanoAddress.BaseAddress).to.eq(true);
    });

    it("decode bech32", () => {
      const decoded = utils.decodeBech32(
        "addr1q9dmtr22dz54qn8pgx4yhle64nhwpqjyxsueaetdcxxa7k5jhh20yrgtl00c5mqnpjm5p8aud9cqldgwf3rq8dxvgy4snhadga"
      );

      expect(decoded.prefix).to.eq("addr");
      expect(decoded.value).to.eq(
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
  });

  describe("address", () => {
    describe(`Enterprise Address`, () => {
      const adr = "addr1v8s64t9zghl44sewflpszrfx4jqc7mppd8hgp2ctakuqpaq3k5f9m";
      const address = utils.getAddressFromBech32(adr) as CardanoAddress.EnterpriseAddress;
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
        expect(paymentHash).to.eq("e1aaaca245ff5ac32e4fc3010d26ac818f6c2169ee80ab0bedb800f4");
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
      const address = utils.getAddressFromBech32(adr) as CardanoAddress.BaseAddress;
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
        expect(paymentHash).to.eq("5bb58d4a68a9504ce141aa4bff3aaceee0824434399ee56dc18ddf5a");
      });
      it("paymentHash type", () => {
        expect(hashType).to.eq(types.HashType.ADDRESS);
      });

      it("stakeHash", () => {
        expect(stakeHash).to.eq("92bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b");
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
      const address = utils.getAddressFromBech32(adr) as CardanoAddress.RewardAddress;
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
        expect(stakeHash).to.eq("92bdd4f20d0bfbdf8a6c130cb7409fbc69700fb50e4c4603b4cc412b");
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
        expect(fee).to.eq(168141);
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
        expect(fee).to.eq(176765);
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
        expect(fee).to.eq(169637);
      });

      it("calculates correct fees with plutusData", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [],
          plutusData: {
            constructor: 0,
            fields: [123, 123],
          },
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(171617);
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
        expect(fee).to.eq(178261);
      });

      it("calculates correct fees with plutusData & token", () => {
        const output: types.Output = {
          amount: new BigNumber(5000000),
          address: stub.receiverAddress,
          tokens: [stub.tokens[0]],
          plutusData: {
            constructor: 0,
            fields: [123, 123],
          },
        };
        const tx = new Transaction({ protocolParams: stub.pParams }).paymentTransaction({
          inputs: stub.UTXOs,
          outputs: [output],
          changeAddress: stub.changeAddress,
          ttl: 3000000,
        });

        const fee = tx.getFee().toNumber();
        expect(fee).to.eq(180241);
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
      describe("output scenario 1", () => {
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
            stub.UTXOs[stub.UTXOs.length - 1].amount
              .minus(output.amount)
              .minus(tx.getFee())
              .toNumber()
          );
        });
      });

      describe("output scenario 2", () => {
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
            stub.UTXOs[stub.UTXOs.length - 2].amount
              .plus(stub.UTXOs[stub.UTXOs.length - 1].amount)
              .minus(output.amount)
              .minus(tx.getFee())
              .toNumber()
          );
          expect(outputs[1].tokens[0].amount.toNumber()).to.eq(
            stub.tokens[0].amount.minus(output.tokens[0].amount).toNumber()
          );
        });
      });
    });
  });
});
