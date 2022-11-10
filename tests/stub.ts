import BigNumber from "bignumber.js";
import { utils } from "../src";
import { BaseAddress } from "../src/address";
import { HashCredential, HashType, Input, NetworkId } from "../src/types";

export const pParams = {
  minFeeA: 44,
  minFeeB: 155381,
  keyDeposit: 2000000,
  lovelacePerUtxoWord: 34482,
  collateralPercent: 150,
  priceStep: 0.0000721,
  priceMem: 0.0577,
  languageView: {
    PlutusScriptV1: {
      "sha2_256-memory-arguments": 4,
      "equalsString-cpu-arguments-constant": 1000,
      "cekDelayCost-exBudgetMemory": 100,
      "lessThanEqualsByteString-cpu-arguments-intercept": 103599,
      "divideInteger-memory-arguments-minimum": 1,
      "appendByteString-cpu-arguments-slope": 621,
      "blake2b-cpu-arguments-slope": 29175,
      "iData-cpu-arguments": 150000,
      "encodeUtf8-cpu-arguments-slope": 1000,
      "unBData-cpu-arguments": 150000,
      "multiplyInteger-cpu-arguments-intercept": 61516,
      "cekConstCost-exBudgetMemory": 100,
      "nullList-cpu-arguments": 150000,
      "equalsString-cpu-arguments-intercept": 150000,
      "trace-cpu-arguments": 150000,
      "mkNilData-memory-arguments": 32,
      "lengthOfByteString-cpu-arguments": 150000,
      "cekBuiltinCost-exBudgetCPU": 29773,
      "bData-cpu-arguments": 150000,
      "subtractInteger-cpu-arguments-slope": 0,
      "unIData-cpu-arguments": 150000,
      "consByteString-memory-arguments-intercept": 0,
      "divideInteger-memory-arguments-slope": 1,
      "divideInteger-cpu-arguments-model-arguments-slope": 118,
      "listData-cpu-arguments": 150000,
      "headList-cpu-arguments": 150000,
      "chooseData-memory-arguments": 32,
      "equalsInteger-cpu-arguments-intercept": 136542,
      "sha3_256-cpu-arguments-slope": 82363,
      "sliceByteString-cpu-arguments-slope": 5000,
      "unMapData-cpu-arguments": 150000,
      "lessThanInteger-cpu-arguments-intercept": 179690,
      "mkCons-cpu-arguments": 150000,
      "appendString-memory-arguments-intercept": 0,
      "modInteger-cpu-arguments-model-arguments-slope": 118,
      "ifThenElse-cpu-arguments": 1,
      "mkNilPairData-cpu-arguments": 150000,
      "lessThanEqualsInteger-cpu-arguments-intercept": 145276,
      "addInteger-memory-arguments-slope": 1,
      "chooseList-memory-arguments": 32,
      "constrData-memory-arguments": 32,
      "decodeUtf8-cpu-arguments-intercept": 150000,
      "equalsData-memory-arguments": 1,
      "subtractInteger-memory-arguments-slope": 1,
      "appendByteString-memory-arguments-intercept": 0,
      "lengthOfByteString-memory-arguments": 4,
      "headList-memory-arguments": 32,
      "listData-memory-arguments": 32,
      "consByteString-cpu-arguments-intercept": 150000,
      "unIData-memory-arguments": 32,
      "remainderInteger-memory-arguments-minimum": 1,
      "bData-memory-arguments": 32,
      "lessThanByteString-cpu-arguments-slope": 248,
      "encodeUtf8-memory-arguments-intercept": 0,
      "cekStartupCost-exBudgetCPU": 100,
      "multiplyInteger-memory-arguments-intercept": 0,
      "unListData-memory-arguments": 32,
      "remainderInteger-cpu-arguments-model-arguments-slope": 118,
      "cekVarCost-exBudgetCPU": 29773,
      "remainderInteger-memory-arguments-slope": 1,
      "cekForceCost-exBudgetCPU": 29773,
      "sha2_256-cpu-arguments-slope": 29175,
      "equalsInteger-memory-arguments": 1,
      "indexByteString-memory-arguments": 1,
      "addInteger-memory-arguments-intercept": 1,
      "chooseUnit-cpu-arguments": 150000,
      "sndPair-cpu-arguments": 150000,
      "cekLamCost-exBudgetCPU": 29773,
      "fstPair-cpu-arguments": 150000,
      "quotientInteger-memory-arguments-minimum": 1,
      "decodeUtf8-cpu-arguments-slope": 1000,
      "lessThanInteger-memory-arguments": 1,
      "lessThanEqualsInteger-cpu-arguments-slope": 1366,
      "fstPair-memory-arguments": 32,
      "modInteger-memory-arguments-intercept": 0,
      "unConstrData-cpu-arguments": 150000,
      "lessThanEqualsInteger-memory-arguments": 1,
      "chooseUnit-memory-arguments": 32,
      "sndPair-memory-arguments": 32,
      "addInteger-cpu-arguments-intercept": 197209,
      "decodeUtf8-memory-arguments-slope": 8,
      "equalsData-cpu-arguments-intercept": 150000,
      "mapData-cpu-arguments": 150000,
      "mkPairData-cpu-arguments": 150000,
      "quotientInteger-cpu-arguments-constant": 148000,
      "consByteString-memory-arguments-slope": 1,
      "cekVarCost-exBudgetMemory": 100,
      "indexByteString-cpu-arguments": 150000,
      "unListData-cpu-arguments": 150000,
      "equalsInteger-cpu-arguments-slope": 1326,
      "cekStartupCost-exBudgetMemory": 100,
      "subtractInteger-cpu-arguments-intercept": 197209,
      "divideInteger-cpu-arguments-model-arguments-intercept": 425507,
      "divideInteger-memory-arguments-intercept": 0,
      "cekForceCost-exBudgetMemory": 100,
      "blake2b-cpu-arguments-intercept": 2477736,
      "remainderInteger-cpu-arguments-constant": 148000,
      "tailList-cpu-arguments": 150000,
      "encodeUtf8-cpu-arguments-intercept": 150000,
      "equalsString-cpu-arguments-slope": 1000,
      "lessThanByteString-memory-arguments": 1,
      "multiplyInteger-cpu-arguments-slope": 11218,
      "appendByteString-cpu-arguments-intercept": 396231,
      "lessThanEqualsByteString-cpu-arguments-slope": 248,
      "modInteger-memory-arguments-slope": 1,
      "addInteger-cpu-arguments-slope": 0,
      "equalsData-cpu-arguments-slope": 10000,
      "decodeUtf8-memory-arguments-intercept": 0,
      "chooseList-cpu-arguments": 150000,
      "constrData-cpu-arguments": 150000,
      "equalsByteString-memory-arguments": 1,
      "cekApplyCost-exBudgetCPU": 29773,
      "quotientInteger-memory-arguments-slope": 1,
      "verifySignature-cpu-arguments-intercept": 3345831,
      "unMapData-memory-arguments": 32,
      "mkCons-memory-arguments": 32,
      "sliceByteString-memory-arguments-slope": 1,
      "sha3_256-memory-arguments": 4,
      "ifThenElse-memory-arguments": 1,
      "mkNilPairData-memory-arguments": 32,
      "equalsByteString-cpu-arguments-slope": 247,
      "appendString-cpu-arguments-intercept": 150000,
      "quotientInteger-cpu-arguments-model-arguments-slope": 118,
      "cekApplyCost-exBudgetMemory": 100,
      "equalsString-memory-arguments": 1,
      "multiplyInteger-memory-arguments-slope": 1,
      "cekBuiltinCost-exBudgetMemory": 100,
      "remainderInteger-memory-arguments-intercept": 0,
      "sha2_256-cpu-arguments-intercept": 2477736,
      "remainderInteger-cpu-arguments-model-arguments-intercept": 425507,
      "lessThanEqualsByteString-memory-arguments": 1,
      "tailList-memory-arguments": 32,
      "mkNilData-cpu-arguments": 150000,
      "chooseData-cpu-arguments": 150000,
      "unBData-memory-arguments": 32,
      "blake2b-memory-arguments": 4,
      "iData-memory-arguments": 32,
      "nullList-memory-arguments": 32,
      "cekDelayCost-exBudgetCPU": 29773,
      "subtractInteger-memory-arguments-intercept": 1,
      "lessThanByteString-cpu-arguments-intercept": 103599,
      "consByteString-cpu-arguments-slope": 1000,
      "appendByteString-memory-arguments-slope": 1,
      "trace-memory-arguments": 32,
      "divideInteger-cpu-arguments-constant": 148000,
      "cekConstCost-exBudgetCPU": 29773,
      "encodeUtf8-memory-arguments-slope": 8,
      "quotientInteger-cpu-arguments-model-arguments-intercept": 425507,
      "mapData-memory-arguments": 32,
      "appendString-cpu-arguments-slope": 1000,
      "modInteger-cpu-arguments-constant": 148000,
      "verifySignature-cpu-arguments-slope": 1,
      "unConstrData-memory-arguments": 32,
      "quotientInteger-memory-arguments-intercept": 0,
      "equalsByteString-cpu-arguments-constant": 150000,
      "sliceByteString-memory-arguments-intercept": 0,
      "mkPairData-memory-arguments": 32,
      "equalsByteString-cpu-arguments-intercept": 112536,
      "appendString-memory-arguments-slope": 1,
      "lessThanInteger-cpu-arguments-slope": 497,
      "modInteger-cpu-arguments-model-arguments-intercept": 425507,
      "modInteger-memory-arguments-minimum": 1,
      "sha3_256-cpu-arguments-intercept": 0,
      "verifySignature-memory-arguments": 1,
      "cekLamCost-exBudgetMemory": 100,
      "sliceByteString-cpu-arguments-intercept": 150000,
    },
  },
};

export const tokens = [
  {
    policyId: "30aa65f5efa96eaf3bc9a3e76ff47c6eac6472f908d6591f93e329fe",
    assetName: "6d65746143686c616d79646961546f6b656e",
    amount: new BigNumber(500),
  },
  {
    policyId: "d070f6b0e45fc3cd280e21fd4fcac4d59b3d35b23387eb6559455879",
    assetName: "6e6575726f6e",
    amount: new BigNumber(500),
  },
  {
    policyId: "3691ce00d8a2bd035a85d77e5428e34da58de9acbeedeee8256b8175",
    assetName: "5350414345424142455a32323238",
    amount: new BigNumber(1),
  },
  {
    policyId: "3691ce00d8a2bd035a85d77e5428e34da58de9acbeedeee8256b8175",
    assetName: "5350414345424142455a393635",
    amount: new BigNumber(1),
  },
];

const HARDENED = 2147483648;
const paymentCred0: HashCredential = {
  hash: "4eec4012a1a73ae0074028b016d1084cd9d39ac55bff0b52590dd137",
  type: HashType.ADDRESS,
  bipPath: {
    purpose: 1852 + HARDENED,
    coin: 1815 + HARDENED,
    account: 0 + HARDENED,
    chain: 0,
    index: 0,
  },
};

const paymentCred1: HashCredential = {
  hash: "fbe39e3c2b61a864096ebbfb8ed7b7a3fc0a0265c8adafa954920e6f",
  type: HashType.ADDRESS,
  bipPath: {
    purpose: 1852 + HARDENED,
    coin: 1815 + HARDENED,
    account: 0 + HARDENED,
    chain: 0,
    index: 1,
  },
};

const paymentCredChange: HashCredential = {
  hash: "041c5529bacf35c90dedf1a4c0394b04e2129ed6759adee51782ebdf",
  type: HashType.ADDRESS,
  bipPath: {
    purpose: 1852 + HARDENED,
    coin: 1815 + HARDENED,
    account: 0 + HARDENED,
    chain: 1,
    index: 0,
  },
};

const stakeCredential: HashCredential = {
  hash: "45d3dfac74ec966ef4b1ecafb14f6c0b8b0244505788bd8920892940",
  type: HashType.ADDRESS,
  bipPath: {
    purpose: 1852 + HARDENED,
    coin: 1815 + HARDENED,
    account: 0 + HARDENED,
    chain: 2,
    index: 0,
  },
};

const address1 = new BaseAddress(NetworkId.MAINNET, paymentCred0, stakeCredential);
const address2 = new BaseAddress(NetworkId.MAINNET, paymentCred1, stakeCredential);

export const changeAddress = new BaseAddress(NetworkId.MAINNET, paymentCredChange, stakeCredential);
export const receiverAddress = utils.getAddressFromBech32(
  "addr1qycq3tsm0efv9gtwdpet0r5rx6xjgezkat84jyypufnzd2uaqtd5xya2y49fx5tr68ezuew4hd04nedg4udzx8gnxlns9j9kd5"
);

export const UTXOs: Array<Input> = [
  {
    txId: "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13314",
    index: 0,
    amount: new BigNumber(50000000),
    tokens: [],
    address: address2,
  },
  {
    txId: "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13313",
    index: 0,
    amount: new BigNumber(40000000),
    tokens: tokens,
    address: address2,
  },
  {
    txId: "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13312",
    index: 0,
    amount: new BigNumber(30000000),
    tokens: [],
    address: address1,
  },
  {
    txId: "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13311",
    index: 0,
    amount: new BigNumber(20000000),
    tokens: [],
    address: address1,
  },
  {
    txId: "d771da555feac5b6376652b284c20b39f7b5aef8ea8e03c927f7f731fed13310",
    index: 0,
    amount: new BigNumber(10000000),
    tokens: [],
    address: address1,
  },
];
