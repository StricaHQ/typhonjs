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
  PlutusScriptV3 = "PlutusScriptV3",
}

export enum VoteType {
  NO = 0,
  YES = 1,
  ABSTAIN = 2,
}

export enum VoterType {
  CC_HOT_KEY = 0,
  CC_HOT_SCRIPT = 1,
  DREP_KEY = 2,
  DREP_SCRIPT = 3,
  POOL_KEY = 4,
}

export enum GovActionType {
  PARAM_CHANGE_ACTION = 0,
  HF_INIT_ACTION = 1,
  TREASURY_WITHDRAW_ACTION = 2,
  NO_CONFIDENCE_ACTION = 3,
  UPDATE_COMMITTEE_ACTION = 4,
  NEW_CONSTITUTION_ACTION = 5,
  INFO_ACTION = 6,
}

export type HashCredential = {
  hash: Buffer;
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
  hash: Buffer;
  type: HashType.SCRIPT;
  plutusScript?: PlutusScript;
  nativeScript?: NativeScript;
};

export type Credential = HashCredential | ScriptCredential;

export type StakeCredential = Credential;
export type DRepCredential = Credential;
export type CommitteeHotCredential = Credential;
export type CommitteeColdCredential = Credential;

export enum CertificateType {
  STAKE_REGISTRATION = 0,
  STAKE_DE_REGISTRATION = 1,
  STAKE_DELEGATION = 2,
  STAKE_KEY_REGISTRATION = 7,
  STAKE_KEY_DE_REGISTRATION = 8,
  VOTE_DELEGATION = 9,
  STAKE_VOTE_DELEG = 10,
  STAKE_REG_DELEG = 11,
  VOTE_REG_DELEG = 12,
  STAKE_VOTE_REG_DELEG = 13,
  COMMITTEE_AUTH_HOT = 14,
  COMMITTEE_RESIGN_COLD = 15,
  DREP_REG = 16,
  DREP_DE_REG = 17,
  DREP_UPDATE = 18,
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
  plutusScript?: PlutusScript;
  nativeScript?: NativeScript;
};

export type ReferenceInput = {
  txId: string;
  index: number;
  amount?: BigNumber;
  tokens?: Array<Token>;
  address?: ShelleyAddress;
  plutusData?: PlutusData;
  plutusScript?: PlutusScript;
  nativeScript?: NativeScript;
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
  plutusScript?: PlutusScript;
  nativeScript?: NativeScript;
};

export enum DRepType {
  ADDRESS = 0,
  SCRIPT = 1,
  ABSTAIN = 2,
  NO_CONFIDENCE = 3,
}

export type DRep = {
  type: DRepType;
  key: Buffer | undefined;
};

export type Anchor = {
  url: string;
  hash: Buffer;
};

export type StakeRegistrationCertificate = {
  type: CertificateType.STAKE_REGISTRATION;
  cert: {
    stakeCredential: StakeCredential;
  };
};

export type StakeDeRegistrationCertificate = {
  type: CertificateType.STAKE_DE_REGISTRATION;
  cert: {
    stakeCredential: StakeCredential;
  };
};

export type StakeDelegationCertificate = {
  type: CertificateType.STAKE_DELEGATION;
  cert: {
    stakeCredential: StakeCredential;
    poolHash: string;
  };
};

export type StakeKeyRegistrationCertificate = {
  type: CertificateType.STAKE_KEY_REGISTRATION;
  cert: {
    stakeCredential: StakeCredential;
    deposit: BigNumber;
  };
};

export type StakeKeyDeRegistrationCertificate = {
  type: CertificateType.STAKE_KEY_DE_REGISTRATION;
  cert: {
    stakeCredential: StakeCredential;
    deposit: BigNumber;
  };
};

export type VoteDelegationCertificate = {
  type: CertificateType.VOTE_DELEGATION;
  cert: {
    stakeCredential: StakeCredential;
    dRep: DRep;
  };
};

export type StakeVoteDelegationCertificate = {
  type: CertificateType.STAKE_VOTE_DELEG;
  cert: {
    stakeCredential: StakeCredential;
    poolKeyHash: Buffer;
    dRep: DRep;
  };
};

export type StakeRegDelegationCertificate = {
  type: CertificateType.STAKE_REG_DELEG;
  cert: {
    stakeCredential: StakeCredential;
    poolKeyHash: Buffer;
    deposit: BigNumber;
  };
};

export type VoteRegDelegationCertificate = {
  type: CertificateType.VOTE_REG_DELEG;
  cert: {
    stakeCredential: StakeCredential;
    dRep: DRep;
    deposit: BigNumber;
  };
};

export type StakeVoteRegDelegationCertificate = {
  type: CertificateType.STAKE_VOTE_REG_DELEG;
  cert: {
    stakeCredential: StakeCredential;
    poolKeyHash: Buffer;
    dRep: DRep;
    deposit: BigNumber;
  };
};

export type CommitteeAuthHotCertificate = {
  type: CertificateType.COMMITTEE_AUTH_HOT;
  cert: {
    coldCredential: CommitteeColdCredential;
    hotCredential: CommitteeHotCredential;
  };
};

export type CommitteeResignColdCertificate = {
  type: CertificateType.COMMITTEE_RESIGN_COLD;
  cert: {
    coldCredential: CommitteeColdCredential;
    anchor: Anchor | null;
  };
};

export type DRepRegCertificate = {
  type: CertificateType.DREP_REG;
  cert: {
    dRepCredential: DRepCredential;
    deposit: BigNumber;
    anchor: Anchor | null;
  };
};

export type DRepDeRegCertificate = {
  type: CertificateType.DREP_DE_REG;
  cert: {
    dRepCredential: DRepCredential;
    deposit: BigNumber;
  };
};

export type DRepUpdateCertificate = {
  type: CertificateType.DREP_UPDATE;
  cert: {
    dRepCredential: DRepCredential;
    anchor: Anchor | null;
  };
};

export type Withdrawal = {
  rewardAccount: RewardAddress;
  amount: BigNumber;
};

export type Certificate =
  | StakeRegistrationCertificate
  | StakeDeRegistrationCertificate
  | StakeDelegationCertificate
  | StakeKeyRegistrationCertificate
  | StakeKeyDeRegistrationCertificate
  | VoteDelegationCertificate
  | StakeVoteDelegationCertificate
  | StakeRegDelegationCertificate
  | VoteRegDelegationCertificate
  | StakeVoteRegDelegationCertificate
  | CommitteeAuthHotCertificate
  | CommitteeResignColdCertificate
  | DRepRegCertificate
  | DRepDeRegCertificate
  | DRepUpdateCertificate;

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
  PlutusScriptV1: Array<number>;
  PlutusScriptV2: Array<number>;
  PlutusScriptV3: Array<number>;
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
  minFeeRefScriptCostPerByte: number;
};

export type CostMdls = {
  plutusV1: Array<number> | undefined;
  plutusV2: Array<number> | undefined;
  plutusV3: Array<number> | undefined;
};

export type ProtocolParamUpdate = {
  minFeeA?: BigNumber;
  minFeeB?: BigNumber;
  maxBlockBodySize?: number;
  maxTransactionSize?: number;
  maxBlockHeaderSize?: number;
  stakeKeyDeposit?: BigNumber;
  poolDeposit?: BigNumber;
  poolRetireMaxEpoch?: number;
  n?: number;
  pledgeInfluence?: [number, number];
  expansionRate?: [number, number];
  treasuryGrowthRate?: [number, number];
  minPoolCost?: BigNumber;
  adaPerUtxoByte?: BigNumber;
  costMdls?: CostMdls;
  exUnitPrices?: {
    mem: [number, number];
    steps: [number, number];
  };
  maxTxExUnits?: {
    mem: number;
    steps: number;
  };
  maxBlockExUnits?: {
    mem: number;
    steps: number;
  };
  maxValueSize?: BigNumber;
  collateralPercent?: number;
  maxCollateralInputs?: number;
  poolVotingThreshold?: {
    motionNoConfidence: number;
    committeeNormal: number;
    committeeNoConfidence: number;
    hfInitiation: number;
    securityParamVoting: number;
  };
  dRepVotingThreshold?: {
    motionNoConfidence: number;
    committeeNormal: number;
    committeeNoConfidence: number;
    updateConstitution: number;
    hfInitiation: number;
    networkParamVoting: number;
    economicParamVoting: number;
    technicalParamVoting: number;
    govParamVoting: number;
    treasuryWithdrawal: number;
  };
  minCommitteeSize?: number;
  committeeTermLimit?: number;
  govActionValidity?: number;
  govActionDeposit?: BigNumber;
  dRepDeposit?: BigNumber;
  dRepInactivity?: number;
  refScriptCostByte?: [number, number];
};

export type ParameterChangeAction = {
  type: GovActionType.PARAM_CHANGE_ACTION;
  action: {
    prevActionId: GovActionId | null;
    protocolParamUpdate: ProtocolParamUpdate;
    policyHash: Buffer | null;
  };
};

export type HardForkInitAction = {
  type: GovActionType.HF_INIT_ACTION;
  action: {
    prevActionId: GovActionId | null;
    protocolVersion: [number, number];
  };
};

export type TreasuryWithdrawalsAction = {
  type: GovActionType.TREASURY_WITHDRAW_ACTION;
  action: {
    withdrawals: Array<Withdrawal>;
    policyHash: Buffer | null;
  };
};

export type NoConfidenceAction = {
  type: GovActionType.NO_CONFIDENCE_ACTION;
  action: {
    prevActionId: GovActionId | null;
  };
};

export type UpdateCommitteeAction = {
  type: GovActionType.UPDATE_COMMITTEE_ACTION;
  action: {
    prevActionId: GovActionId | null;
    removeColdCreds: Array<CommitteeColdCredential>;
    addColdCreds: Array<{
      credential: CommitteeColdCredential;
      epoch: number;
    }>;
    threshold: [number, number];
  };
};

export type NewConstitutionAction = {
  type: GovActionType.NEW_CONSTITUTION_ACTION;
  action: {
    prevActionId: GovActionId | null;
    constitution: {
      anchor: Anchor;
      scriptHash: Buffer | null;
    };
  };
};

export type InfoAction = {
  type: GovActionType.INFO_ACTION;
};

export type GovAction =
  | ParameterChangeAction
  | HardForkInitAction
  | TreasuryWithdrawalsAction
  | NoConfidenceAction
  | UpdateCommitteeAction
  | NewConstitutionAction
  | InfoAction;

export type GovActionId = {
  txId: Buffer;
  index: number;
};

export type Vote = {
  govActionId: GovActionId;
  vote: VoteType;
  anchor: Anchor | null;
};

export type Voter = {
  type: VoterType;
  key: Credential;
};

export type VotingProcedure = {
  voter: Voter;
  votes: Array<Vote>;
};

export type ProposalProcedure = {
  deposit: BigNumber;
  rewardAccount: Buffer;
  govAction: GovAction;
  anchor: Anchor;
};
