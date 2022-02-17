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
  // PlutusScriptV2 = "PlutusScriptV2", upcoming
}

export type HashCredential = {
  hash: string;
  type: HashType.ADDRESS;
  bipPath?: BipPath;
};

type NativeScriptPubKeyHash = {
  pubKeyHash: string;
};

type NativeScriptAll = {
  all: Array<NativeScript>;
};

type NativeScriptAny = {
  any: Array<NativeScript>;
};

type NativeScriptNOfK = {
  n: number;
  k: Array<NativeScript>;
};

type NativeScriptInvalidBefore = {
  invalidBefore: number;
};

type NativeScriptInvalidAfter = {
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
  // TODO: nativeScript?: TYPE
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
  PLUTUS_SCRIPT = 3,
  PLUTUS_DATA = 4,
  REDEEMER = 5,
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
  plutusData?: PlutusDataConstructor;
  redeemer?: Redeemer;
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
  plutusData?: PlutusDataConstructor;
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
  plutusData: PlutusDataConstructor;
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
};

export type ProtocolParams = {
  minFeeA: BigNumber;
  minFeeB: BigNumber;
  stakeKeyDeposit: BigNumber;
  lovelacePerUtxoWord: BigNumber;
  collateralPercent: BigNumber;
  priceSteps: BigNumber;
  priceMem: BigNumber;
  languageView: LanguageView;
};
