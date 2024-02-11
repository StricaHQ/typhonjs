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
export type EncodedInput = [Buffer, number]; // number is trx index
export type EncodedCollateralInput = [Buffer, number]; // number is trx index
export type EncodedTokens = Map<Buffer, Map<Buffer, BigNumber>>;
export type EncodedAmount = BigNumber | [BigNumber, EncodedTokens];
export type EncodedOutput = [Buffer, EncodedAmount, Buffer?];
export type EncodedWithdrawals = Map<Buffer, BigNumber>;
export type EncodedStakeCredential = [HashType, Buffer];
export type EncodedStakeRegistrationCertificate = [
  CertificateType.STAKE_REGISTRATION,
  EncodedStakeCredential
];
export type EncodedStakeDeRegistrationCertificate = [
  CertificateType.STAKE_DE_REGISTRATION,
  EncodedStakeCredential
];
export type EncodedStakeDelegationCertificate = [
  CertificateType.STAKE_DELEGATION,
  EncodedStakeCredential,
  Buffer
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
