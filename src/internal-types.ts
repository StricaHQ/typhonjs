import { Buffer } from "buffer";
import { CborTag } from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import { CertificateType, HashType, WitnessType } from "./types";

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
  Map<WitnessType.PLUTUS_SCRIPT, Array<EncodedPlutusScript>> &
  Map<WitnessType.PLUTUS_DATA, Array<EncodedPlutusData>> &
  Map<WitnessType.REDEEMER, Array<EncodedRedeemer>>;
