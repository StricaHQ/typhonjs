/* eslint-disable no-use-before-define */
import { Buffer } from "buffer";
import BigNumber from "bignumber.js";
import BaseAddress from "./address/BaseAddress";
import ByronAddress from "./address/ByronAddress";
import EnterpriseAddress from "./address/EnterpriseAddress";
import PointerAddress from "./address/PointerAddress";
import RewardAddress from "./address/RewardAddress";

export type ShelleyAddress = BaseAddress | EnterpriseAddress | PointerAddress;

export type CardanoAddress = ShelleyAddress | ByronAddress | RewardAddress;

export type BipPath = {
  purpose: number;
  coin: number;
  account: number;
  chain: number;
  index: number;
};

export enum HashType {
  ADDRESS = 0,
  SCRIPT = 1,
}

export enum PlutusScriptType {
  PlutusScriptV1 = "PlutusScriptV1",
  PlutusScriptV2 = "PlutusScriptV2",
}

export type HashCredential = {
  hash: string;
  type: HashType.ADDRESS;
  bipPath?: BipPath;
};

export type NativeScriptPubKeyHash = {
  pubKeyHash: string;
};

export type NativeScriptAll = {
  all: Array<NativeScript>;
};

export type NativeScriptAny = {
  any: Array<NativeScript>;
};

export type NativeScriptNOfK = {
  n: number;
  k: Array<NativeScript>;
};

export type NativeScriptInvalidBefore = {
  invalidBefore: number;
};

export type NativeScriptInvalidAfter = {
  invalidAfter: number;
};

export type NativeScript =
  | NativeScriptPubKeyHash
  | NativeScriptNOfK
  | NativeScriptInvalidBefore
  | NativeScriptInvalidAfter
  | NativeScriptAll
  | NativeScriptAny;

export type PlutusScript = {
  cborHex: string;
  type: PlutusScriptType;
};

export type ScriptCredential = {
  hash: string;
  type: HashType.SCRIPT;
  plutusScript?: PlutusScript;
  nativeScript?: NativeScript;
};

export type Credential = HashCredential | ScriptCredential;

export enum CertificateType {
  STAKE_REGISTRATION = 0,
  STAKE_DE_REGISTRATION = 1,
  STAKE_DELEGATION = 2,
}

export enum WitnessType {
  V_KEY_WITNESS = 0,
  NATIVE_SCRIPT = 1,
  PLUTUS_SCRIPT_V1 = 3,
  PLUTUS_DATA = 4,
  REDEEMER = 5,
  PLUTUS_SCRIPT_V2 = 6,
}

export enum NetworkId {
  MAINNET = 1,
  TESTNET = 0,
}

export enum TransactionBodyItemType {
  INPUTS = 0,
  OUTPUTS = 1,
  FEE = 2,
  TTL = 3,
  CERTIFICATES = 4,
  WITHDRAWALS = 5,
  AUXILIARY_DATA_HASH = 7,
  VALIDITY_INTERVAL_START = 8,
  MINT = 9,
  SCRIPT_DATA_HASH = 11,
  COLLATERAL_INPUTS = 13,
  REQUIRED_SIGNERS = 14,
  NETWORK_ID = 15,
  COLLATERAL_OUTPUT = 16,
  TOTAL_COLLATERAL = 17,
  REFERENCE_INPUTS = 18,
}

export type Token = {
  policyId: string;
  assetName: string;
  amount: BigNumber;
};

export type Input = {
  txId: string;
  index: number;
  amount: BigNumber;
  tokens: Array<Token>;
  address: ShelleyAddress;
  plutusData?: PlutusData;
  redeemer?: Redeemer;
};

export type ReferenceInput = {
  txId: string;
  index: number;
  amount?: BigNumber;
  tokens?: Array<Token>;
  address?: ShelleyAddress;
  plutusData?: PlutusData;
};

export type Asset = {
  assetName: string;
  amount: BigNumber;
};

export type Mint = {
  policyId: string;
  assets: Array<Asset>;
  nativeScript?: NativeScript;
  plutusScript?: PlutusScript;
  redeemer?: Redeemer;
};

export type CollateralInput = {
  txId: string;
  index: number;
  amount: BigNumber;
  address: ShelleyAddress;
};

export type Output = {
  amount: BigNumber;
  address: CardanoAddress;
  tokens: Array<Token>;
  plutusData?: PlutusData;
  plutusDataHash?: string;
};

export type StakeRegistrationCertificate = {
  certType: CertificateType.STAKE_REGISTRATION;
  stakeCredential: Credential;
};

export type StakeDeRegistrationCertificate = {
  certType: CertificateType.STAKE_DE_REGISTRATION;
  stakeCredential: Credential;
};

export type StakeDelegationCertificate = {
  certType: CertificateType.STAKE_DELEGATION;
  stakeCredential: Credential;
  poolHash: string;
};

export type Withdrawal = {
  rewardAccount: RewardAddress;
  amount: BigNumber;
};

export type Certificate =
  | StakeRegistrationCertificate
  | StakeDeRegistrationCertificate
  | StakeDelegationCertificate;

export type VKeyWitness = {
  publicKey: Buffer;
  signature: Buffer;
};

export type MetaDatum = Map<MetaDatum, MetaDatum> | Array<MetaDatum> | number | Buffer | string;

export type Metadata = {
  label: number;
  data: MetaDatum;
};

export type AuxiliaryData = {
  metadata: Array<Metadata>;
  // TODO: nativeScript;
  // TODO: plutusScript;
};

export type PlutusData =
  | number
  | BigNumber
  | Buffer
  | PlutusDataConstructor
  | Array<PlutusData>
  | Map<PlutusData, PlutusData>;

export type PlutusDataConstructor = {
  constructor: number;
  fields: Array<PlutusData>;
};

export type ExUnits = {
  mem: number;
  steps: number;
};

export type Redeemer = {
  plutusData: PlutusData;
  exUnits: ExUnits;
};

export type LanguageView = {
  PlutusScriptV1: {
    "sha2_256-memory-arguments": number;
    "equalsString-cpu-arguments-constant": number;
    "cekDelayCost-exBudgetMemory": number;
    "lessThanEqualsByteString-cpu-arguments-intercept": number;
    "divideInteger-memory-arguments-minimum": number;
    "appendByteString-cpu-arguments-slope": number;
    "blake2b-cpu-arguments-slope": number;
    "iData-cpu-arguments": number;
    "encodeUtf8-cpu-arguments-slope": number;
    "unBData-cpu-arguments": number;
    "multiplyInteger-cpu-arguments-intercept": number;
    "cekConstCost-exBudgetMemory": number;
    "nullList-cpu-arguments": number;
    "equalsString-cpu-arguments-intercept": number;
    "trace-cpu-arguments": number;
    "mkNilData-memory-arguments": number;
    "lengthOfByteString-cpu-arguments": number;
    "cekBuiltinCost-exBudgetCPU": number;
    "bData-cpu-arguments": number;
    "subtractInteger-cpu-arguments-slope": number;
    "unIData-cpu-arguments": number;
    "consByteString-memory-arguments-intercept": number;
    "divideInteger-memory-arguments-slope": number;
    "divideInteger-cpu-arguments-model-arguments-slope": number;
    "listData-cpu-arguments": number;
    "headList-cpu-arguments": number;
    "chooseData-memory-arguments": number;
    "equalsInteger-cpu-arguments-intercept": number;
    "sha3_256-cpu-arguments-slope": number;
    "sliceByteString-cpu-arguments-slope": number;
    "unMapData-cpu-arguments": number;
    "lessThanInteger-cpu-arguments-intercept": number;
    "mkCons-cpu-arguments": number;
    "appendString-memory-arguments-intercept": number;
    "modInteger-cpu-arguments-model-arguments-slope": number;
    "ifThenElse-cpu-arguments": number;
    "mkNilPairData-cpu-arguments": number;
    "lessThanEqualsInteger-cpu-arguments-intercept": number;
    "addInteger-memory-arguments-slope": number;
    "chooseList-memory-arguments": number;
    "constrData-memory-arguments": number;
    "decodeUtf8-cpu-arguments-intercept": number;
    "equalsData-memory-arguments": number;
    "subtractInteger-memory-arguments-slope": number;
    "appendByteString-memory-arguments-intercept": number;
    "lengthOfByteString-memory-arguments": number;
    "headList-memory-arguments": number;
    "listData-memory-arguments": number;
    "consByteString-cpu-arguments-intercept": number;
    "unIData-memory-arguments": number;
    "remainderInteger-memory-arguments-minimum": number;
    "bData-memory-arguments": number;
    "lessThanByteString-cpu-arguments-slope": number;
    "encodeUtf8-memory-arguments-intercept": number;
    "cekStartupCost-exBudgetCPU": number;
    "multiplyInteger-memory-arguments-intercept": number;
    "unListData-memory-arguments": number;
    "remainderInteger-cpu-arguments-model-arguments-slope": number;
    "cekVarCost-exBudgetCPU": number;
    "remainderInteger-memory-arguments-slope": number;
    "cekForceCost-exBudgetCPU": number;
    "sha2_256-cpu-arguments-slope": number;
    "equalsInteger-memory-arguments": number;
    "indexByteString-memory-arguments": number;
    "addInteger-memory-arguments-intercept": number;
    "chooseUnit-cpu-arguments": number;
    "sndPair-cpu-arguments": number;
    "cekLamCost-exBudgetCPU": number;
    "fstPair-cpu-arguments": number;
    "quotientInteger-memory-arguments-minimum": number;
    "decodeUtf8-cpu-arguments-slope": number;
    "lessThanInteger-memory-arguments": number;
    "lessThanEqualsInteger-cpu-arguments-slope": number;
    "fstPair-memory-arguments": number;
    "modInteger-memory-arguments-intercept": number;
    "unConstrData-cpu-arguments": number;
    "lessThanEqualsInteger-memory-arguments": number;
    "chooseUnit-memory-arguments": number;
    "sndPair-memory-arguments": number;
    "addInteger-cpu-arguments-intercept": number;
    "decodeUtf8-memory-arguments-slope": number;
    "equalsData-cpu-arguments-intercept": number;
    "mapData-cpu-arguments": number;
    "mkPairData-cpu-arguments": number;
    "quotientInteger-cpu-arguments-constant": number;
    "consByteString-memory-arguments-slope": number;
    "cekVarCost-exBudgetMemory": number;
    "indexByteString-cpu-arguments": number;
    "unListData-cpu-arguments": number;
    "equalsInteger-cpu-arguments-slope": number;
    "cekStartupCost-exBudgetMemory": number;
    "subtractInteger-cpu-arguments-intercept": number;
    "divideInteger-cpu-arguments-model-arguments-intercept": number;
    "divideInteger-memory-arguments-intercept": number;
    "cekForceCost-exBudgetMemory": number;
    "blake2b-cpu-arguments-intercept": number;
    "remainderInteger-cpu-arguments-constant": number;
    "tailList-cpu-arguments": number;
    "encodeUtf8-cpu-arguments-intercept": number;
    "equalsString-cpu-arguments-slope": number;
    "lessThanByteString-memory-arguments": number;
    "multiplyInteger-cpu-arguments-slope": number;
    "appendByteString-cpu-arguments-intercept": number;
    "lessThanEqualsByteString-cpu-arguments-slope": number;
    "modInteger-memory-arguments-slope": number;
    "addInteger-cpu-arguments-slope": number;
    "equalsData-cpu-arguments-slope": number;
    "decodeUtf8-memory-arguments-intercept": number;
    "chooseList-cpu-arguments": number;
    "constrData-cpu-arguments": number;
    "equalsByteString-memory-arguments": number;
    "cekApplyCost-exBudgetCPU": number;
    "quotientInteger-memory-arguments-slope": number;
    "verifySignature-cpu-arguments-intercept": number;
    "unMapData-memory-arguments": number;
    "mkCons-memory-arguments": number;
    "sliceByteString-memory-arguments-slope": number;
    "sha3_256-memory-arguments": number;
    "ifThenElse-memory-arguments": number;
    "mkNilPairData-memory-arguments": number;
    "equalsByteString-cpu-arguments-slope": number;
    "appendString-cpu-arguments-intercept": number;
    "quotientInteger-cpu-arguments-model-arguments-slope": number;
    "cekApplyCost-exBudgetMemory": number;
    "equalsString-memory-arguments": number;
    "multiplyInteger-memory-arguments-slope": number;
    "cekBuiltinCost-exBudgetMemory": number;
    "remainderInteger-memory-arguments-intercept": number;
    "sha2_256-cpu-arguments-intercept": number;
    "remainderInteger-cpu-arguments-model-arguments-intercept": number;
    "lessThanEqualsByteString-memory-arguments": number;
    "tailList-memory-arguments": number;
    "mkNilData-cpu-arguments": number;
    "chooseData-cpu-arguments": number;
    "unBData-memory-arguments": number;
    "blake2b-memory-arguments": number;
    "iData-memory-arguments": number;
    "nullList-memory-arguments": number;
    "cekDelayCost-exBudgetCPU": number;
    "subtractInteger-memory-arguments-intercept": number;
    "lessThanByteString-cpu-arguments-intercept": number;
    "consByteString-cpu-arguments-slope": number;
    "appendByteString-memory-arguments-slope": number;
    "trace-memory-arguments": number;
    "divideInteger-cpu-arguments-constant": number;
    "cekConstCost-exBudgetCPU": number;
    "encodeUtf8-memory-arguments-slope": number;
    "quotientInteger-cpu-arguments-model-arguments-intercept": number;
    "mapData-memory-arguments": number;
    "appendString-cpu-arguments-slope": number;
    "modInteger-cpu-arguments-constant": number;
    "verifySignature-cpu-arguments-slope": number;
    "unConstrData-memory-arguments": number;
    "quotientInteger-memory-arguments-intercept": number;
    "equalsByteString-cpu-arguments-constant": number;
    "sliceByteString-memory-arguments-intercept": number;
    "mkPairData-memory-arguments": number;
    "equalsByteString-cpu-arguments-intercept": number;
    "appendString-memory-arguments-slope": number;
    "lessThanInteger-cpu-arguments-slope": number;
    "modInteger-cpu-arguments-model-arguments-intercept": number;
    "modInteger-memory-arguments-minimum": number;
    "sha3_256-cpu-arguments-intercept": number;
    "verifySignature-memory-arguments": number;
    "cekLamCost-exBudgetMemory": number;
    "sliceByteString-cpu-arguments-intercept": number;
  };
  PlutusScriptV2: {
    "addInteger-cpu-arguments-intercept": number;
    "addInteger-cpu-arguments-slope": number;
    "addInteger-memory-arguments-intercept": number;
    "addInteger-memory-arguments-slope": number;
    "appendByteString-cpu-arguments-intercept": number;
    "appendByteString-cpu-arguments-slope": number;
    "appendByteString-memory-arguments-intercept": number;
    "appendByteString-memory-arguments-slope": number;
    "appendString-cpu-arguments-intercept": number;
    "appendString-cpu-arguments-slope": number;
    "appendString-memory-arguments-intercept": number;
    "appendString-memory-arguments-slope": number;
    "bData-cpu-arguments": number;
    "bData-memory-arguments": number;
    "blake2b_256-cpu-arguments-intercept": number;
    "blake2b_256-cpu-arguments-slope": number;
    "blake2b_256-memory-arguments": number;
    "cekApplyCost-exBudgetCPU": number;
    "cekApplyCost-exBudgetMemory": number;
    "cekBuiltinCost-exBudgetCPU": number;
    "cekBuiltinCost-exBudgetMemory": number;
    "cekConstCost-exBudgetCPU": number;
    "cekConstCost-exBudgetMemory": number;
    "cekDelayCost-exBudgetCPU": number;
    "cekDelayCost-exBudgetMemory": number;
    "cekForceCost-exBudgetCPU": number;
    "cekForceCost-exBudgetMemory": number;
    "cekLamCost-exBudgetCPU": number;
    "cekLamCost-exBudgetMemory": number;
    "cekStartupCost-exBudgetCPU": number;
    "cekStartupCost-exBudgetMemory": number;
    "cekVarCost-exBudgetCPU": number;
    "cekVarCost-exBudgetMemory": number;
    "chooseData-cpu-arguments": number;
    "chooseData-memory-arguments": number;
    "chooseList-cpu-arguments": number;
    "chooseList-memory-arguments": number;
    "chooseUnit-cpu-arguments": number;
    "chooseUnit-memory-arguments": number;
    "consByteString-cpu-arguments-intercept": number;
    "consByteString-cpu-arguments-slope": number;
    "consByteString-memory-arguments-intercept": number;
    "consByteString-memory-arguments-slope": number;
    "constrData-cpu-arguments": number;
    "constrData-memory-arguments": number;
    "decodeUtf8-cpu-arguments-intercept": number;
    "decodeUtf8-cpu-arguments-slope": number;
    "decodeUtf8-memory-arguments-intercept": number;
    "decodeUtf8-memory-arguments-slope": number;
    "divideInteger-cpu-arguments-constant": number;
    "divideInteger-cpu-arguments-model-arguments-intercept": number;
    "divideInteger-cpu-arguments-model-arguments-slope": number;
    "divideInteger-memory-arguments-intercept": number;
    "divideInteger-memory-arguments-minimum": number;
    "divideInteger-memory-arguments-slope": number;
    "encodeUtf8-cpu-arguments-intercept": number;
    "encodeUtf8-cpu-arguments-slope": number;
    "encodeUtf8-memory-arguments-intercept": number;
    "encodeUtf8-memory-arguments-slope": number;
    "equalsByteString-cpu-arguments-constant": number;
    "equalsByteString-cpu-arguments-intercept": number;
    "equalsByteString-cpu-arguments-slope": number;
    "equalsByteString-memory-arguments": number;
    "equalsData-cpu-arguments-intercept": number;
    "equalsData-cpu-arguments-slope": number;
    "equalsData-memory-arguments": number;
    "equalsInteger-cpu-arguments-intercept": number;
    "equalsInteger-cpu-arguments-slope": number;
    "equalsInteger-memory-arguments": number;
    "equalsString-cpu-arguments-constant": number;
    "equalsString-cpu-arguments-intercept": number;
    "equalsString-cpu-arguments-slope": number;
    "equalsString-memory-arguments": number;
    "fstPair-cpu-arguments": number;
    "fstPair-memory-arguments": number;
    "headList-cpu-arguments": number;
    "headList-memory-arguments": number;
    "iData-cpu-arguments": number;
    "iData-memory-arguments": number;
    "ifThenElse-cpu-arguments": number;
    "ifThenElse-memory-arguments": number;
    "indexByteString-cpu-arguments": number;
    "indexByteString-memory-arguments": number;
    "lengthOfByteString-cpu-arguments": number;
    "lengthOfByteString-memory-arguments": number;
    "lessThanByteString-cpu-arguments-intercept": number;
    "lessThanByteString-cpu-arguments-slope": number;
    "lessThanByteString-memory-arguments": number;
    "lessThanEqualsByteString-cpu-arguments-intercept": number;
    "lessThanEqualsByteString-cpu-arguments-slope": number;
    "lessThanEqualsByteString-memory-arguments": number;
    "lessThanEqualsInteger-cpu-arguments-intercept": number;
    "lessThanEqualsInteger-cpu-arguments-slope": number;
    "lessThanEqualsInteger-memory-arguments": number;
    "lessThanInteger-cpu-arguments-intercept": number;
    "lessThanInteger-cpu-arguments-slope": number;
    "lessThanInteger-memory-arguments": number;
    "listData-cpu-arguments": number;
    "listData-memory-arguments": number;
    "mapData-cpu-arguments": number;
    "mapData-memory-arguments": number;
    "mkCons-cpu-arguments": number;
    "mkCons-memory-arguments": number;
    "mkNilData-cpu-arguments": number;
    "mkNilData-memory-arguments": number;
    "mkNilPairData-cpu-arguments": number;
    "mkNilPairData-memory-arguments": number;
    "mkPairData-cpu-arguments": number;
    "mkPairData-memory-arguments": number;
    "modInteger-cpu-arguments-constant": number;
    "modInteger-cpu-arguments-model-arguments-intercept": number;
    "modInteger-cpu-arguments-model-arguments-slope": number;
    "modInteger-memory-arguments-intercept": number;
    "modInteger-memory-arguments-minimum": number;
    "modInteger-memory-arguments-slope": number;
    "multiplyInteger-cpu-arguments-intercept": number;
    "multiplyInteger-cpu-arguments-slope": number;
    "multiplyInteger-memory-arguments-intercept": number;
    "multiplyInteger-memory-arguments-slope": number;
    "nullList-cpu-arguments": number;
    "nullList-memory-arguments": number;
    "quotientInteger-cpu-arguments-constant": number;
    "quotientInteger-cpu-arguments-model-arguments-intercept": number;
    "quotientInteger-cpu-arguments-model-arguments-slope": number;
    "quotientInteger-memory-arguments-intercept": number;
    "quotientInteger-memory-arguments-minimum": number;
    "quotientInteger-memory-arguments-slope": number;
    "remainderInteger-cpu-arguments-constant": number;
    "remainderInteger-cpu-arguments-model-arguments-intercept": number;
    "remainderInteger-cpu-arguments-model-arguments-slope": number;
    "remainderInteger-memory-arguments-intercept": number;
    "remainderInteger-memory-arguments-minimum": number;
    "remainderInteger-memory-arguments-slope": number;
    "serialiseData-cpu-arguments-intercept": number;
    "serialiseData-cpu-arguments-slope": number;
    "serialiseData-memory-arguments-intercept": number;
    "serialiseData-memory-arguments-slope": number;
    "sha2_256-cpu-arguments-intercept": number;
    "sha2_256-cpu-arguments-slope": number;
    "sha2_256-memory-arguments": number;
    "sha3_256-cpu-arguments-intercept": number;
    "sha3_256-cpu-arguments-slope": number;
    "sha3_256-memory-arguments": number;
    "sliceByteString-cpu-arguments-intercept": number;
    "sliceByteString-cpu-arguments-slope": number;
    "sliceByteString-memory-arguments-intercept": number;
    "sliceByteString-memory-arguments-slope": number;
    "sndPair-cpu-arguments": number;
    "sndPair-memory-arguments": number;
    "subtractInteger-cpu-arguments-intercept": number;
    "subtractInteger-cpu-arguments-slope": number;
    "subtractInteger-memory-arguments-intercept": number;
    "subtractInteger-memory-arguments-slope": number;
    "tailList-cpu-arguments": number;
    "tailList-memory-arguments": number;
    "trace-cpu-arguments": number;
    "trace-memory-arguments": number;
    "unBData-cpu-arguments": number;
    "unBData-memory-arguments": number;
    "unConstrData-cpu-arguments": number;
    "unConstrData-memory-arguments": number;
    "unIData-cpu-arguments": number;
    "unIData-memory-arguments": number;
    "unListData-cpu-arguments": number;
    "unListData-memory-arguments": number;
    "unMapData-cpu-arguments": number;
    "unMapData-memory-arguments": number;
    "verifyEcdsaSecp256k1Signature-cpu-arguments": number;
    "verifyEcdsaSecp256k1Signature-memory-arguments": number;
    "verifyEd25519Signature-cpu-arguments-intercept": number;
    "verifyEd25519Signature-cpu-arguments-slope": number;
    "verifyEd25519Signature-memory-arguments": number;
    "verifySchnorrSecp256k1Signature-cpu-arguments-intercept": number;
    "verifySchnorrSecp256k1Signature-cpu-arguments-slope": number;
    "verifySchnorrSecp256k1Signature-memory-arguments": number;
  };
};

export type ProtocolParams = {
  minFeeA: BigNumber;
  minFeeB: BigNumber;
  stakeKeyDeposit: BigNumber;
  lovelacePerUtxoWord: BigNumber;
  utxoCostPerByte: BigNumber;
  collateralPercent: BigNumber;
  priceSteps: BigNumber;
  priceMem: BigNumber;
  languageView: LanguageView;
  maxTxSize?: number;
  maxValueSize: number;
};
