/* eslint-disable no-use-before-define */
import { Buffer } from "buffer";
import { CborTag } from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import { CertificateType, HashType, VoterType, VoteType, WitnessType } from "./types";

export type TokenBundle = Record<
  string, // this is policy id
  Array<{
    assetName: string;
    amount: BigNumber;
  }>
>;

export enum RedeemerTag {
  SPEND = 0,
  MINT = 1,
  CERT = 2,
  REWARD = 3,
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
  VOTING_PROCEDURES = 19,
}

export enum OutputItemType {
  ADDRESS = 0,
  VALUE = 1,
  DATUM_OPTION = 2,
  SCRIPT_REF = 3,
}

export type EncodedInput = [Buffer, number]; // number is trx index
export type EncodedCollateralInput = [Buffer, number]; // number is trx index
export type EncodedTokens = Map<Buffer, Map<Buffer, BigNumber>>;
export type EncodedAmount = BigNumber | [BigNumber, EncodedTokens];
export type EncodedDatumOption = [0, Buffer] | [1, CborTag];
export type EncodedOutput = Map<
  OutputItemType,
  Buffer | EncodedAmount | EncodedDatumOption | CborTag
>;
export type EncodedWithdrawals = Map<Buffer, BigNumber>;
export type EncodedCredential = [HashType, Buffer];
export type EncodedCommitteeHotCredential = EncodedCredential;
export type EncodedCommitteeColdCredential = EncodedCredential;
export type EncodedDRepCredential = EncodedCredential;
export type EncodedDRep = [0, Buffer] | [1, Buffer] | [2] | [3];
export type EncodedAnchor = [string, Buffer] | null;
export type EncodedStakeRegistrationCertificate = [
  CertificateType.STAKE_REGISTRATION,
  EncodedCredential
];
export type EncodedStakeDeRegistrationCertificate = [
  CertificateType.STAKE_DE_REGISTRATION,
  EncodedCredential
];
export type EncodedStakeDelegationCertificate = [
  CertificateType.STAKE_DELEGATION,
  EncodedCredential,
  Buffer
];
export type EncodedStakeKeyRegistrationCertificate = [
  CertificateType.STAKE_KEY_REGISTRATION,
  EncodedCredential,
  BigNumber
];
export type EncodedStakeKeyDeRegistrationCertificate = [
  CertificateType.STAKE_KEY_DE_REGISTRATION,
  EncodedCredential,
  BigNumber
];
export type EncodedVoteDelegationCertificate = [
  CertificateType.VOTE_DELEGATION,
  EncodedCredential,
  EncodedDRep
];
export type EncodedStakeVoteDelegationCertificate = [
  CertificateType.STAKE_VOTE_DELEG,
  EncodedCredential,
  Buffer,
  EncodedDRep
];
export type EncodedStakeRegDelegationCertificate = [
  CertificateType.STAKE_REG_DELEG,
  EncodedCredential,
  Buffer,
  BigNumber
];
export type EncodedVoteRegDelegationCertificate = [
  CertificateType.VOTE_REG_DELEG,
  EncodedCredential,
  EncodedDRep,
  BigNumber
];
export type EncodedStakeVoteRegDelegationCertificate = [
  CertificateType.STAKE_VOTE_REG_DELEG,
  EncodedCredential,
  Buffer,
  EncodedDRep,
  BigNumber
];
export type EncodedCommitteeAuthHotCertificate = [
  CertificateType.COMMITTEE_AUTH_HOT,
  EncodedCommitteeColdCredential,
  EncodedCommitteeHotCredential
];
export type EncodedCommitteeResignColdCertificate = [
  CertificateType.COMMITTEE_RESIGN_COLD,
  EncodedCommitteeColdCredential,
  EncodedAnchor
];
export type EncodedDRepRegCertificate = [
  CertificateType.DREP_REG,
  EncodedDRepCredential,
  BigNumber,
  EncodedAnchor
];
export type EncodedDRepDeRegCertificate = [
  CertificateType.DREP_DE_REG,
  EncodedDRepCredential,
  BigNumber
];
export type EncodedDRepUpdateCertificate = [
  CertificateType.DREP_UPDATE,
  EncodedDRepCredential,
  EncodedAnchor
];
export type EncodedCertificate =
  | EncodedStakeRegistrationCertificate
  | EncodedStakeDeRegistrationCertificate
  | EncodedStakeDelegationCertificate
  | EncodedStakeKeyRegistrationCertificate
  | EncodedStakeKeyDeRegistrationCertificate
  | EncodedVoteDelegationCertificate
  | EncodedStakeVoteDelegationCertificate
  | EncodedStakeRegDelegationCertificate
  | EncodedVoteRegDelegationCertificate
  | EncodedStakeVoteRegDelegationCertificate
  | EncodedCommitteeAuthHotCertificate
  | EncodedCommitteeResignColdCertificate
  | EncodedDRepRegCertificate
  | EncodedDRepDeRegCertificate
  | EncodedDRepUpdateCertificate;

export type EncodedExUnits = [number, number];
export type EncodedVKeyWitness = [Buffer, Buffer];
export type EncodedPlutusScript = Buffer;
export type EncodedPlutusData =
  | number
  | BigNumber
  | Buffer
  | Array<EncodedPlutusData>
  | Map<EncodedPlutusData, EncodedPlutusData>
  | CborTag;

export type EncodedRedeemer = [number, number, EncodedPlutusData, EncodedExUnits];

export type EncodedWitnesses = Map<WitnessType.V_KEY_WITNESS, Array<EncodedVKeyWitness>> &
  Map<WitnessType.NATIVE_SCRIPT, Array<EncodedNativeScript>> &
  Map<WitnessType.PLUTUS_SCRIPT_V1, Array<EncodedPlutusScript>> &
  Map<WitnessType.PLUTUS_SCRIPT_V2, Array<EncodedPlutusScript>> &
  Map<WitnessType.PLUTUS_DATA, Array<EncodedPlutusData>> &
  Map<WitnessType.REDEEMER, Array<EncodedRedeemer>>;

// NativeScript types
type NativeScriptPubKeyHash = [0, Buffer];
type NativeScriptAll = [1, Array<EncodedNativeScript>];
type NativeScriptAny = [2, Array<EncodedNativeScript>];
type NativeScriptNOfK = [3, number, Array<EncodedNativeScript>];
type NativeScriptInvalidBefore = [4, number];
type NativeScriptInvalidAfter = [5, number];

export type EncodedNativeScript =
  | NativeScriptPubKeyHash
  | NativeScriptAll
  | NativeScriptAny
  | NativeScriptNOfK
  | NativeScriptInvalidBefore
  | NativeScriptInvalidAfter;
// NativeScript types end

// Voting Procedure encoding types
export type EncodedGovActionId = [Buffer, number];
export type EncodedVote = VoteType;
export type EncodedVoter = [VoterType, Buffer];
export type EncodedVotingProcedure = [EncodedVote, EncodedAnchor];
export type EncodedVotingProcedures = Map<
  EncodedVoter,
  Map<EncodedGovActionId, EncodedVotingProcedure>
>;
