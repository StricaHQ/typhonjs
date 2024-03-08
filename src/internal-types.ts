/* eslint-disable no-use-before-define */
import { Buffer } from "buffer";
import { CborTag } from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import { CertificateType, HashType, WitnessType } from "./types";

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
export type EncodedStakeCredential = [HashType, Buffer];
export type EncodedStakeRegistrationCertificate = [
  CertificateType.STAKE_REGISTRATION,
  EncodedStakeCredential,
];
export type EncodedStakeDeRegistrationCertificate = [
  CertificateType.STAKE_DE_REGISTRATION,
  EncodedStakeCredential,
];
export type EncodedStakeDelegationCertificate = [
  CertificateType.STAKE_DELEGATION,
  EncodedStakeCredential,
  Buffer,
];
export type EncodedCertificate =
  | EncodedStakeRegistrationCertificate
  | EncodedStakeDeRegistrationCertificate
  | EncodedStakeDelegationCertificate;

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
