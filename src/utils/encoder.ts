/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { Buffer } from "buffer";
import * as cbors from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import _ from "lodash";
import {
  WitnessType,
  CertificateType,
  PlutusDataConstructor,
  PlutusData,
  CollateralInput,
  LanguageView,
  AuxiliaryData,
  Certificate,
  Input,
  Metadata,
  Output,
  StakeDelegationCertificate,
  StakeDeRegistrationCertificate,
  StakeRegistrationCertificate,
  Token,
  VKeyWitness,
  Withdrawal,
  PlutusScriptType,
  NativeScript,
  Mint,
  ReferenceInput,
  StakeKeyRegistrationCertificate,
  StakeKeyDeRegistrationCertificate,
  VoteDelegationCertificate,
  DRep,
  DRepType,
  StakeVoteDelegationCertificate,
  StakeRegDelegationCertificate,
  VoteRegDelegationCertificate,
  StakeVoteRegDelegationCertificate,
  CommitteeAuthHotCertificate,
  CommitteeResignColdCertificate,
  Anchor,
  DRepRegCertificate,
  Credential,
  DRepDeRegCertificate,
  DRepUpdateCertificate,
  VotingProcedure,
  Vote,
  Voter,
  ProposalProcedure,
  GovActionType,
  ProtocolParamUpdate,
} from "../types";
import { sanitizeMetadata } from "./helpers";
import { hash32 } from "./crypto";
import {
  EncodedAmount,
  EncodedCertificate,
  EncodedCollateralInput,
  EncodedPlutusData,
  EncodedInput,
  EncodedOutput,
  EncodedPlutusScript,
  EncodedRedeemer,
  EncodedCredential,
  EncodedStakeDelegationCertificate,
  EncodedStakeDeRegistrationCertificate,
  EncodedStakeRegistrationCertificate,
  EncodedTokens,
  EncodedVKeyWitness,
  EncodedWithdrawals,
  EncodedWitnesses,
  RedeemerTag,
  EncodedNativeScript,
  TokenBundle,
  OutputItemType,
  EncodedStakeKeyRegistrationCertificate,
  EncodedStakeKeyDeRegistrationCertificate,
  EncodedVoteDelegationCertificate,
  EncodedDRep,
  EncodedStakeVoteDelegationCertificate,
  EncodedStakeRegDelegationCertificate,
  EncodedVoteRegDelegationCertificate,
  EncodedStakeVoteRegDelegationCertificate,
  EncodedCommitteeAuthHotCertificate,
  EncodedCommitteeResignColdCertificate,
  EncodedAnchor,
  EncodedDRepRegCertificate,
  EncodedDRepDeRegCertificate,
  EncodedDRepUpdateCertificate,
  EncodedVotingProcedures,
  EncodedVoter,
  EncodedGovActionId,
  EncodedVotingProcedure,
  EncodedProposalProcedure,
  EncodedGovAction,
  EncodedProtocolParamUpdate,
  EncodedConstitution,
} from "../internal-types";

export const encodeInputs = (inputs: Array<Input | ReferenceInput>): Array<EncodedInput> => {
  const encodedInputs: Array<EncodedInput> = inputs.map((input) => {
    const txHash = Buffer.from(input.txId, "hex");
    return [txHash, input.index];
  });
  return encodedInputs;
};

export const encodeCollaterals = (
  collaterals: Array<CollateralInput>
): Array<EncodedCollateralInput> => {
  const encodedCollateralInputs: Array<EncodedInput> = collaterals.map((collateral) => {
    const txHash = Buffer.from(collateral.txId, "hex");
    return [txHash, collateral.index];
  });
  return encodedCollateralInputs;
};

export const encodeOutputTokens = (tokens: Array<Token>): EncodedTokens => {
  const policyIdMap = new Map<Buffer, Map<Buffer, BigNumber>>();
  const tokenBundle = _(tokens)
    .groupBy(({ policyId }) => policyId)
    .value() as TokenBundle;

  _.forEach(tokenBundle, (token, policyId) => {
    const tokenMap = new Map<Buffer, BigNumber>();
    token.forEach(({ assetName, amount }) => {
      tokenMap.set(Buffer.from(assetName, "hex"), amount);
    });
    policyIdMap.set(Buffer.from(policyId, "hex"), tokenMap);
  });
  return policyIdMap;
};

export const encodeMint = (mints: Array<Mint>): EncodedTokens => {
  const policyIdMap = new Map<Buffer, Map<Buffer, BigNumber>>();
  for (const mint of mints) {
    const tokenMap = new Map<Buffer, BigNumber>();
    mint.assets.forEach(({ assetName, amount }) => {
      tokenMap.set(Buffer.from(assetName, "hex"), amount);
    });
    policyIdMap.set(Buffer.from(mint.policyId, "hex"), tokenMap);
  }

  return policyIdMap;
};

export const encodeOutput = (output: Output): EncodedOutput => {
  const amount: EncodedAmount =
    output.tokens.length > 0 ? [output.amount, encodeOutputTokens(output.tokens)] : output.amount;

  // Babbage era output with inline datum and refScript support
  const encodedOutput: EncodedOutput = new Map();
  encodedOutput.set(OutputItemType.ADDRESS, output.address.getBytes());
  encodedOutput.set(OutputItemType.VALUE, amount);

  const plutusDataHash = output.plutusDataHash
    ? Buffer.from(output.plutusDataHash, "hex")
    : undefined;
  if (plutusDataHash) {
    encodedOutput.set(OutputItemType.DATUM_OPTION, [0, plutusDataHash]);
  } else if (output.plutusData) {
    const encodedPlutusData = cbors.Encoder.encode(encodePlutusData(output.plutusData));
    encodedOutput.set(OutputItemType.DATUM_OPTION, [1, new cbors.CborTag(encodedPlutusData, 24)]);
  }

  let refScript;
  if (output.plutusScript) {
    if (output.plutusScript.type === PlutusScriptType.PlutusScriptV1) {
      refScript = [1, Buffer.from(output.plutusScript.cborHex, "hex")];
    } else if (output.plutusScript.type === PlutusScriptType.PlutusScriptV2) {
      refScript = [2, Buffer.from(output.plutusScript.cborHex, "hex")];
    } else if (output.plutusScript.type === PlutusScriptType.PlutusScriptV3) {
      refScript = [3, Buffer.from(output.plutusScript.cborHex, "hex")];
    }
  } else if (output.nativeScript) {
    const encodedNativeScript = cbors.Encoder.encode(encodeNativeScript(output.nativeScript));
    refScript = [0, encodedNativeScript];
  }

  if (refScript) {
    const refScriptCbor = cbors.Encoder.encode(refScript);
    encodedOutput.set(OutputItemType.SCRIPT_REF, new cbors.CborTag(refScriptCbor, 24));
  }
  return encodedOutput;
};

export const encodeOutputs = (outputs: Array<Output>): Array<EncodedOutput> => {
  const encodedOutputs: Array<EncodedOutput> = outputs.map((output) => {
    return encodeOutput(output);
  }, []);
  return encodedOutputs;
};

export const encodeWithdrawals = (withdrawals: Withdrawal[]): EncodedWithdrawals => {
  const encodedWithdrawals: EncodedWithdrawals = new Map();
  withdrawals.forEach((withdrawal) => {
    const stakingAddress: Buffer = withdrawal.rewardAccount.getBytes();
    encodedWithdrawals.set(stakingAddress, withdrawal.amount);
  });
  return encodedWithdrawals;
};

export const encodeDRep = (drep: DRep): EncodedDRep => {
  let encodedDRep: EncodedDRep;
  switch (drep.type) {
    case DRepType.ADDRESS:
      encodedDRep = [0, drep.key as Buffer];
      break;
    case DRepType.SCRIPT:
      encodedDRep = [1, drep.key as Buffer];
      break;
    case DRepType.ABSTAIN:
      encodedDRep = [2];
      break;
    case DRepType.NO_CONFIDENCE:
      encodedDRep = [3];
      break;
    default:
      throw new Error("Invalid DRep type");
  }
  return encodedDRep;
};

export const encodeAnchor = (anchor: Anchor | null): EncodedAnchor => {
  if (anchor) {
    return [anchor.url, anchor.hash];
  }
  return null;
};

export const encodeCredential = (credential: Credential): EncodedCredential => {
  const encodedCredential: EncodedCredential = [credential.type, credential.hash];
  return encodedCredential;
};

export const encodeStakeRegistrationCertificate = (
  certificate: StakeRegistrationCertificate
): EncodedStakeRegistrationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  return [CertificateType.STAKE_REGISTRATION, encodedStakeCredential];
};

export const encodeStakeDeRegistrationCertificate = (
  certificate: StakeDeRegistrationCertificate
): EncodedStakeDeRegistrationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  return [CertificateType.STAKE_DE_REGISTRATION, encodedStakeCredential];
};

export const encodeStakeDelegationCertificate = (
  certificate: StakeDelegationCertificate
): EncodedStakeDelegationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  const poolHash = Buffer.from(certificate.cert.poolHash, "hex");
  return [CertificateType.STAKE_DELEGATION, encodedStakeCredential, poolHash];
};

export const encodeStakeKeyRegistrationCertificate = (
  certificate: StakeKeyRegistrationCertificate
): EncodedStakeKeyRegistrationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  return [CertificateType.STAKE_KEY_REGISTRATION, encodedStakeCredential, certificate.cert.deposit];
};

export const encodeStakeKeyDeRegistrationCertificate = (
  certificate: StakeKeyDeRegistrationCertificate
): EncodedStakeKeyDeRegistrationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  return [
    CertificateType.STAKE_KEY_DE_REGISTRATION,
    encodedStakeCredential,
    certificate.cert.deposit,
  ];
};

export const encodeVoteDelegationCertificate = (
  certificate: VoteDelegationCertificate
): EncodedVoteDelegationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  const encodedDRep = encodeDRep(certificate.cert.dRep);
  return [CertificateType.VOTE_DELEGATION, encodedStakeCredential, encodedDRep];
};

export const encodeStakeVoteDelegationCertificate = (
  certificate: StakeVoteDelegationCertificate
): EncodedStakeVoteDelegationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  const encodedDRep = encodeDRep(certificate.cert.dRep);
  return [
    CertificateType.STAKE_VOTE_DELEG,
    encodedStakeCredential,
    certificate.cert.poolKeyHash,
    encodedDRep,
  ];
};

export const encodeStakeRegDelegationCertificate = (
  certificate: StakeRegDelegationCertificate
): EncodedStakeRegDelegationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  return [
    CertificateType.STAKE_REG_DELEG,
    encodedStakeCredential,
    certificate.cert.poolKeyHash,
    certificate.cert.deposit,
  ];
};

export const encodeVoteRegDelegationCertificate = (
  certificate: VoteRegDelegationCertificate
): EncodedVoteRegDelegationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  const encodedDRep = encodeDRep(certificate.cert.dRep);
  return [
    CertificateType.VOTE_REG_DELEG,
    encodedStakeCredential,
    encodedDRep,
    certificate.cert.deposit,
  ];
};

export const encodeStakeVoteRegDelegationCertificate = (
  certificate: StakeVoteRegDelegationCertificate
): EncodedStakeVoteRegDelegationCertificate => {
  const encodedStakeCredential = encodeCredential(certificate.cert.stakeCredential);
  const encodedDRep = encodeDRep(certificate.cert.dRep);
  return [
    CertificateType.STAKE_VOTE_REG_DELEG,
    encodedStakeCredential,
    certificate.cert.poolKeyHash,
    encodedDRep,
    certificate.cert.deposit,
  ];
};

export const encodeCommitteeAuthHotCertificate = (
  certificate: CommitteeAuthHotCertificate
): EncodedCommitteeAuthHotCertificate => {
  const encodedCommitteeColdCred = encodeCredential(certificate.cert.coldCredential);
  const encodedCommitteeHotCred = encodeCredential(certificate.cert.hotCredential);

  return [CertificateType.COMMITTEE_AUTH_HOT, encodedCommitteeColdCred, encodedCommitteeHotCred];
};

export const encodeCommitteeResignColdCertificate = (
  certificate: CommitteeResignColdCertificate
): EncodedCommitteeResignColdCertificate => {
  const encodedCommitteeColdCred = encodeCredential(certificate.cert.coldCredential);
  return [
    CertificateType.COMMITTEE_RESIGN_COLD,
    encodedCommitteeColdCred,
    encodeAnchor(certificate.cert.anchor),
  ];
};

export const encodeDRepRegCertificate = (
  certificate: DRepRegCertificate
): EncodedDRepRegCertificate => {
  const encodedDRepCred = encodeCredential(certificate.cert.dRepCredential);

  return [
    CertificateType.DREP_REG,
    encodedDRepCred,
    certificate.cert.deposit,
    encodeAnchor(certificate.cert.anchor),
  ];
};

export const encodeDRepDeRegCertificate = (
  certificate: DRepDeRegCertificate
): EncodedDRepDeRegCertificate => {
  const encodedDRepCred = encodeCredential(certificate.cert.dRepCredential);

  return [CertificateType.DREP_DE_REG, encodedDRepCred, certificate.cert.deposit];
};

export const encodeDRepUpdateCertificate = (
  certificate: DRepUpdateCertificate
): EncodedDRepUpdateCertificate => {
  const encodedDRepCred = encodeCredential(certificate.cert.dRepCredential);

  return [CertificateType.DREP_UPDATE, encodedDRepCred, encodeAnchor(certificate.cert.anchor)];
};

export const encodeCertificates = (certificates: Array<Certificate>): Array<EncodedCertificate> => {
  const encodedCertificates: Array<EncodedCertificate> = [];

  certificates.forEach((certificate) => {
    switch (certificate.type) {
      case CertificateType.STAKE_REGISTRATION: {
        encodedCertificates.push(encodeStakeRegistrationCertificate(certificate));
        break;
      }
      case CertificateType.STAKE_DE_REGISTRATION: {
        encodedCertificates.push(encodeStakeDeRegistrationCertificate(certificate));
        break;
      }
      case CertificateType.STAKE_DELEGATION: {
        encodedCertificates.push(encodeStakeDelegationCertificate(certificate));
        break;
      }
      case CertificateType.STAKE_KEY_REGISTRATION: {
        encodedCertificates.push(encodeStakeKeyRegistrationCertificate(certificate));
        break;
      }
      case CertificateType.STAKE_KEY_DE_REGISTRATION: {
        encodedCertificates.push(encodeStakeKeyDeRegistrationCertificate(certificate));
        break;
      }
      case CertificateType.VOTE_DELEGATION: {
        encodedCertificates.push(encodeVoteDelegationCertificate(certificate));
        break;
      }
      case CertificateType.STAKE_VOTE_DELEG: {
        encodedCertificates.push(encodeStakeVoteDelegationCertificate(certificate));
        break;
      }
      case CertificateType.STAKE_REG_DELEG: {
        encodedCertificates.push(encodeStakeRegDelegationCertificate(certificate));
        break;
      }
      case CertificateType.VOTE_REG_DELEG: {
        encodedCertificates.push(encodeVoteRegDelegationCertificate(certificate));
        break;
      }
      case CertificateType.STAKE_VOTE_REG_DELEG: {
        encodedCertificates.push(encodeStakeVoteRegDelegationCertificate(certificate));
        break;
      }
      case CertificateType.COMMITTEE_AUTH_HOT: {
        encodedCertificates.push(encodeCommitteeAuthHotCertificate(certificate));
        break;
      }
      case CertificateType.COMMITTEE_RESIGN_COLD: {
        encodedCertificates.push(encodeCommitteeResignColdCertificate(certificate));
        break;
      }
      case CertificateType.DREP_REG: {
        encodedCertificates.push(encodeDRepRegCertificate(certificate));
        break;
      }
      case CertificateType.DREP_DE_REG: {
        encodedCertificates.push(encodeDRepDeRegCertificate(certificate));
        break;
      }
      case CertificateType.DREP_UPDATE: {
        encodedCertificates.push(encodeDRepUpdateCertificate(certificate));
        break;
      }
      default:
        throw new Error("unsupported certificate type");
    }
  });
  return encodedCertificates;
};

export const encodeVKeyWitness = (vKeyWitness: Array<VKeyWitness>): Array<EncodedVKeyWitness> => {
  // create a map of unique v keys
  const vKeyMap: Map<string, Buffer> = new Map();
  for (const vKey of vKeyWitness) {
    vKeyMap.set(vKey.publicKey.toString("hex"), vKey.signature);
  }

  const encodedVKeyWitness: Array<EncodedVKeyWitness> = [];
  for (const [vKey, sig] of vKeyMap) {
    encodedVKeyWitness.push([Buffer.from(vKey, "hex"), sig]);
  }
  return encodedVKeyWitness;
};

export const encodeWitnesses = (
  vKeyWitness: Array<VKeyWitness>,
  inputs: Array<Input>,
  plutusDataList: Array<PlutusData>,
  plutusScriptMap: Map<string, PlutusScriptType>,
  nativeScripts: Array<NativeScript>,
  mints: Array<Mint>
): EncodedWitnesses => {
  const encodedWitnesses: EncodedWitnesses = new Map();
  if (vKeyWitness.length > 0) {
    encodedWitnesses.set(WitnessType.V_KEY_WITNESS, encodeVKeyWitness(vKeyWitness));
  }

  const sortedInputs = _.orderBy(inputs, ["txId", "index"], ["asc", "asc"]);
  const sortedMints = _.orderBy(mints, ["policyId"], ["asc"]);
  const encodedRedeemers: Array<EncodedRedeemer> = [];
  const encodedPlutusDataMap: Map<string, EncodedPlutusData> = new Map();

  for (const d of plutusDataList) {
    const encodedPlutusData = encodePlutusData(d);
    const edCbor = cbors.Encoder.encode(encodedPlutusData);
    const edHash = hash32(edCbor);
    encodedPlutusDataMap.set(edHash.toString("hex"), encodedPlutusData);
  }

  for (const [index, input] of sortedInputs.entries()) {
    if (input.redeemer) {
      const encodedPlutusData = encodePlutusData(input.redeemer.plutusData);
      encodedRedeemers.push([
        RedeemerTag.SPEND,
        index,
        encodedPlutusData,
        [input.redeemer.exUnits.mem, input.redeemer.exUnits.steps],
      ]);
    }
  }

  for (const [index, mint] of sortedMints.entries()) {
    if (mint.plutusScript && mint.redeemer) {
      const encodedPlutusData = encodePlutusData(mint.redeemer.plutusData);
      encodedRedeemers.push([
        RedeemerTag.MINT,
        index,
        encodedPlutusData,
        [mint.redeemer.exUnits.mem, mint.redeemer.exUnits.steps],
      ]);
    }
  }

  const encodedPlutusDataList: EncodedPlutusData = [];
  for (const [, encodedPlutusData] of encodedPlutusDataMap) {
    encodedPlutusDataList.push(encodedPlutusData);
  }
  const encodedPlutusScriptsV1: Array<EncodedPlutusScript> = [];
  const encodedPlutusScriptsV2: Array<EncodedPlutusScript> = [];
  for (const [script, scriptType] of plutusScriptMap) {
    if (scriptType === PlutusScriptType.PlutusScriptV1) {
      const pls = cbors.Decoder.decode(Buffer.from(script, "hex"));
      encodedPlutusScriptsV1.push(pls.value);
    } else if (scriptType === PlutusScriptType.PlutusScriptV2) {
      const pls = cbors.Decoder.decode(Buffer.from(script, "hex"));
      encodedPlutusScriptsV2.push(pls.value);
    } else {
      throw new Error("Unsupported PlutusScript Version");
    }
  }
  if (encodedPlutusScriptsV1.length) {
    encodedWitnesses.set(WitnessType.PLUTUS_SCRIPT_V1, encodedPlutusScriptsV1);
  }
  if (encodedPlutusScriptsV2.length) {
    encodedWitnesses.set(WitnessType.PLUTUS_SCRIPT_V2, encodedPlutusScriptsV2);
  }

  const encodedNativeScriptMap: Map<string, EncodedNativeScript> = new Map();
  for (const ns of nativeScripts) {
    const encodedNativeScript = encodeNativeScript(ns);
    const nsCbor = cbors.Encoder.encode(encodedNativeScript);
    encodedNativeScriptMap.set(nsCbor.toString("hex"), encodedNativeScript);
  }

  const encodedNativeScripts = [];
  for (const [, encodedNS] of encodedNativeScriptMap) {
    encodedNativeScripts.push(encodedNS);
  }

  if (encodedNativeScripts.length) {
    encodedWitnesses.set(WitnessType.NATIVE_SCRIPT, encodedNativeScripts);
  }

  if (encodedPlutusDataList.length)
    encodedWitnesses.set(WitnessType.PLUTUS_DATA, encodedPlutusDataList);

  if (encodedRedeemers.length) {
    encodedWitnesses.set(WitnessType.REDEEMER, encodedRedeemers);
  }

  return encodedWitnesses;
};

export const encodeMetadata = (metadataArray: Array<Metadata>): Map<number, unknown> => {
  const encodedMetadata = new Map();
  for (const metadata of metadataArray) {
    encodedMetadata.set(metadata.label, sanitizeMetadata(metadata.data));
  }
  return encodedMetadata;
};

export const encodeAuxiliaryData = (auxiliaryData: AuxiliaryData): cbors.CborTag => {
  const encodedMetadata = encodeMetadata(auxiliaryData.metadata);
  const auxDataMap = new Map();
  auxDataMap.set(0, encodedMetadata);
  return new cbors.CborTag(auxDataMap, 259);
};

const PlutusDataObjectKeys = ["constructor", "fields"];
const createConstructor = (pConstructor: PlutusDataConstructor) => {
  const keys = Object.keys(pConstructor);
  if (
    !(
      keys.every((val) => PlutusDataObjectKeys.includes(val)) &&
      pConstructor.fields instanceof Array
    )
  ) {
    throw new Error("Invalid PlutusData supplied");
  }
  // array is definite length if empty
  let fields: Array<unknown> = [];
  if (pConstructor.fields.length > 0) {
    fields = new cbors.IndefiniteArray();
    for (const field of pConstructor.fields) {
      fields.push(encodePlutusData(field));
    }
  }
  if (pConstructor.constructor < 7) {
    return new cbors.CborTag(fields, 121 + pConstructor.constructor);
  }
  if (pConstructor.constructor > 6 && pConstructor.constructor < 128) {
    const mask = pConstructor.constructor - 7;
    return new cbors.CborTag(fields, 1280 + mask);
  }
  return new cbors.CborTag([pConstructor.constructor, fields], 102);
};
export const encodePlutusData = (plutusData: PlutusData): EncodedPlutusData => {
  if (plutusData instanceof Array) {
    if (plutusData.length > 0) {
      const ary = new cbors.IndefiniteArray();
      for (const d of plutusData) {
        ary.push(encodePlutusData(d));
      }
      return ary;
    }
    return [];
  }
  if (plutusData instanceof Uint8Array) {
    return Buffer.from(plutusData);
  }
  if (plutusData instanceof Buffer) {
    return plutusData;
  }
  if (typeof plutusData === "string") {
    throw new Error("String not supported in PlutusData");
  }
  // TODO: map is also an object, check map first, maybe requires a proper fix
  else if (plutusData instanceof Map) {
    if (plutusData.size > 0) {
      const map = new cbors.IndefiniteMap();
      for (const [key, value] of plutusData.entries()) {
        map.set(key, encodePlutusData(value));
      }
      return map;
    }
    return new Map();
  } else if (BigNumber.isBigNumber(plutusData)) {
    return plutusData;
  } else if (plutusData instanceof Object) {
    const constructorObject = plutusData as PlutusDataConstructor;
    const constructor = createConstructor(constructorObject);
    return constructor;
  } else {
    return plutusData;
  }
};

export const encodeLanguageViews = (
  languageView: LanguageView,
  plutusV1: boolean,
  plutusV2: boolean,
  plutusV3: boolean
): string => {
  const encodedLanguageView = new Map();

  if (plutusV1) {
    // The encoding is Plutus V1 Specific
    // indefinite array encoding
    const indefCostMdls = cbors.IndefiniteArray.from(languageView.PlutusScriptV1);

    // for V1, encode values before adding to view map
    const cborCostMdls = cbors.Encoder.encode(indefCostMdls);
    const langId = cbors.Encoder.encode(0);
    // Plutus V1
    encodedLanguageView.set(langId, cborCostMdls);
  }
  if (plutusV2) {
    // The encoding is Plutus V2 Specific
    encodedLanguageView.set(1, languageView.PlutusScriptV2);
  }
  if (plutusV3) {
    encodedLanguageView.set(2, languageView.PlutusScriptV3);
  }

  return cbors.Encoder.encode(encodedLanguageView).toString("hex");
};

const encodeNativeScripts = (nativeScripts: Array<NativeScript>) => {
  const encodedNativeScripts: Array<EncodedNativeScript> = [];
  for (const ns of nativeScripts) {
    encodedNativeScripts.push(encodeNativeScript(ns));
  }
  return encodedNativeScripts;
};

export const encodeNativeScript = (nativeScript: any): EncodedNativeScript => {
  if (nativeScript.pubKeyHash) {
    return [0, Buffer.from(nativeScript.pubKeyHash, "hex")];
  }
  if (nativeScript.all) {
    return [1, encodeNativeScripts(nativeScript.all)];
  }
  if (nativeScript.any) {
    return [2, encodeNativeScripts(nativeScript.any)];
  }
  if (nativeScript.n) {
    return [3, nativeScript.n, encodeNativeScripts(nativeScript.k)];
  }
  if (nativeScript.invalidBefore) {
    return [4, nativeScript.invalidBefore];
  }
  if (nativeScript.invalidAfter) {
    return [5, nativeScript.invalidAfter];
  }
  throw new Error("Invalid native script");
};

export const encodeVotingProcedures = (
  votingProcedures: Array<VotingProcedure>
): EncodedVotingProcedures => {
  // combine voting procedures with the same voter
  const vpMap: Record<string, { voter: Voter; votes: Array<Vote> }> = {};
  for (const vps of votingProcedures) {
    const voter = `${vps.voter.key.hash.toString("hex")}#${vps.voter.type}`;
    if (!vpMap[voter]) {
      vpMap[voter] = { voter: vps.voter, votes: vps.votes };
    } else {
      vpMap[voter].votes.push(...vps.votes);
    }
  }

  // filter out duplicate votes, latest one wins
  const filteredVotingProcedures: Array<VotingProcedure> = [];
  for (const { voter, votes } of Object.values(vpMap)) {
    const voteMap: Record<string, Vote> = {};
    for (const vote of votes) {
      const govActionId = `${vote.govActionId.txId.toString("hex")}#${vote.govActionId.index}`;
      voteMap[govActionId] = vote;
    }

    filteredVotingProcedures.push({
      voter: voter,
      votes: Object.values(voteMap),
    });
  }

  // encode voting procedures as per conway CDDL
  const encodedVotingProcedures: EncodedVotingProcedures = new Map();
  for (const { voter, votes } of Object.values(vpMap)) {
    const encodedVoter: EncodedVoter = [voter.type, voter.key.hash];
    const encodedVotes: Map<EncodedGovActionId, EncodedVotingProcedure> = new Map();
    for (const vote of votes) {
      const encodedGovActionId: EncodedGovActionId = [
        vote.govActionId.txId,
        vote.govActionId.index,
      ];
      const encodedVotingProcedure: EncodedVotingProcedure = [vote.vote, encodeAnchor(vote.anchor)];
      encodedVotes.set(encodedGovActionId, encodedVotingProcedure);
    }
    encodedVotingProcedures.set(encodedVoter, encodedVotes);
  }
  return encodedVotingProcedures;
};

// encode protocol param change update data following the Conway CDDL specification
export const encodeProtocolParamUpdate = (ppu: ProtocolParamUpdate) => {
  const encodedParamUpdate: EncodedProtocolParamUpdate = new Map();
  if (ppu.minFeeA) {
    encodedParamUpdate.set(0, ppu.minFeeA);
  }
  if (ppu.minFeeB) {
    encodedParamUpdate.set(1, ppu.minFeeB);
  }
  if (ppu.maxBlockBodySize) {
    encodedParamUpdate.set(2, ppu.maxBlockBodySize);
  }
  if (ppu.maxTransactionSize) {
    encodedParamUpdate.set(3, ppu.maxTransactionSize);
  }
  if (ppu.maxBlockHeaderSize) {
    encodedParamUpdate.set(4, ppu.maxBlockHeaderSize);
  }
  if (ppu.stakeKeyDeposit) {
    encodedParamUpdate.set(5, ppu.stakeKeyDeposit);
  }
  if (ppu.poolDeposit) {
    encodedParamUpdate.set(6, ppu.poolDeposit);
  }
  if (ppu.poolRetireMaxEpoch) {
    encodedParamUpdate.set(7, ppu.poolRetireMaxEpoch);
  }
  if (ppu.n) {
    encodedParamUpdate.set(8, ppu.n);
  }
  if (ppu.pledgeInfluence) {
    encodedParamUpdate.set(9, new cbors.CborTag(ppu.pledgeInfluence, 30));
  }
  if (ppu.expansionRate) {
    encodedParamUpdate.set(10, new cbors.CborTag(ppu.expansionRate, 30));
  }
  if (ppu.treasuryGrowthRate) {
    encodedParamUpdate.set(11, new cbors.CborTag(ppu.treasuryGrowthRate, 30));
  }
  if (ppu.minPoolCost) {
    encodedParamUpdate.set(16, ppu.minPoolCost);
  }
  if (ppu.adaPerUtxoByte) {
    encodedParamUpdate.set(17, ppu.adaPerUtxoByte);
  }
  if (ppu.costMdls) {
    const encodedCostMdls = new Map();
    if (ppu.costMdls.plutusV1) {
      encodedCostMdls.set(0, ppu.costMdls.plutusV1);
    }
    if (ppu.costMdls.plutusV2) {
      encodedCostMdls.set(1, ppu.costMdls.plutusV2);
    }
    if (ppu.costMdls.plutusV3) {
      encodedCostMdls.set(2, ppu.costMdls.plutusV3);
    }
    encodedParamUpdate.set(18, encodedCostMdls);
  }
  if (ppu.exUnitPrices) {
    const encodedExUnitPrices = [
      new cbors.CborTag(ppu.exUnitPrices.mem, 30),
      new cbors.CborTag(ppu.exUnitPrices.steps, 30),
    ];
    encodedParamUpdate.set(19, encodedExUnitPrices);
  }
  if (ppu.maxTxExUnits) {
    encodedParamUpdate.set(20, [ppu.maxTxExUnits.mem, ppu.maxTxExUnits.steps]);
  }
  if (ppu.maxBlockExUnits) {
    encodedParamUpdate.set(21, [ppu.maxBlockExUnits.mem, ppu.maxBlockExUnits.steps]);
  }
  if (ppu.maxValueSize) {
    encodedParamUpdate.set(22, ppu.maxValueSize);
  }
  if (ppu.collateralPercent) {
    encodedParamUpdate.set(23, ppu.collateralPercent);
  }
  if (ppu.maxCollateralInputs) {
    encodedParamUpdate.set(24, ppu.maxCollateralInputs);
  }
  if (ppu.poolVotingThreshold) {
    encodedParamUpdate.set(25, [
      ppu.poolVotingThreshold.motionNoConfidence,
      ppu.poolVotingThreshold.committeeNormal,
      ppu.poolVotingThreshold.committeeNoConfidence,
      ppu.poolVotingThreshold.hfInitiation,
      ppu.poolVotingThreshold.securityParamVoting,
    ]);
  }
  if (ppu.dRepVotingThreshold) {
    encodedParamUpdate.set(26, [
      ppu.dRepVotingThreshold.motionNoConfidence,
      ppu.dRepVotingThreshold.committeeNormal,
      ppu.dRepVotingThreshold.committeeNoConfidence,
      ppu.dRepVotingThreshold.updateConstitution,
      ppu.dRepVotingThreshold.hfInitiation,
      ppu.dRepVotingThreshold.networkParamVoting,
      ppu.dRepVotingThreshold.economicParamVoting,
      ppu.dRepVotingThreshold.technicalParamVoting,
      ppu.dRepVotingThreshold.govParamVoting,
      ppu.dRepVotingThreshold.treasuryWithdrawal,
    ]);
  }
  if (ppu.minCommitteeSize) {
    encodedParamUpdate.set(27, ppu.minCommitteeSize);
  }
  if (ppu.committeeTermLimit) {
    encodedParamUpdate.set(28, ppu.committeeTermLimit);
  }
  if (ppu.govActionValidity) {
    encodedParamUpdate.set(29, ppu.govActionValidity);
  }
  if (ppu.govActionDeposit) {
    encodedParamUpdate.set(30, ppu.govActionDeposit);
  }
  if (ppu.dRepDeposit) {
    encodedParamUpdate.set(31, ppu.dRepDeposit);
  }
  if (ppu.dRepInactivity) {
    encodedParamUpdate.set(32, ppu.dRepInactivity);
  }
  if (ppu.refScriptCostByte) {
    encodedParamUpdate.set(33, new cbors.CborTag(ppu.refScriptCostByte, 30));
  }

  return encodedParamUpdate;
};

// encode proposal procedure following the Conway CDDL specification
export const encodeProposalProcedures = (proposalProcedures: Array<ProposalProcedure>) => {
  const encodedProposalProcedures: Array<EncodedProposalProcedure> = [];
  for (const pp of proposalProcedures) {
    let encodedGovAction: EncodedGovAction;
    switch (pp.govAction.type) {
      case GovActionType.PARAM_CHANGE_ACTION: {
        let encodedGovActionId: EncodedGovActionId | null = null;
        if (pp.govAction.action.prevActionId) {
          encodedGovActionId = [
            pp.govAction.action.prevActionId.txId,
            pp.govAction.action.prevActionId.index,
          ];
        }
        const encodedParamUpdate = encodeProtocolParamUpdate(
          pp.govAction.action.protocolParamUpdate
        );

        encodedGovAction = [
          0,
          encodedGovActionId,
          encodedParamUpdate,
          pp.govAction.action.policyHash,
        ];
        break;
      }
      case GovActionType.HF_INIT_ACTION: {
        let encodedGovActionId: EncodedGovActionId | null = null;
        if (pp.govAction.action.prevActionId) {
          encodedGovActionId = [
            pp.govAction.action.prevActionId.txId,
            pp.govAction.action.prevActionId.index,
          ];
        }
        encodedGovAction = [1, encodedGovActionId, pp.govAction.action.protocolVersion];
        break;
      }
      case GovActionType.TREASURY_WITHDRAW_ACTION: {
        const encodedWithdrawals = new Map();
        for (const w of pp.govAction.action.withdrawals) {
          encodedWithdrawals.set(w.rewardAccount, w.amount);
        }
        encodedGovAction = [2, encodedWithdrawals, pp.govAction.action.policyHash];
        break;
      }
      case GovActionType.NO_CONFIDENCE_ACTION: {
        let encodedGovActionId: EncodedGovActionId | null = null;
        if (pp.govAction.action.prevActionId) {
          encodedGovActionId = [
            pp.govAction.action.prevActionId.txId,
            pp.govAction.action.prevActionId.index,
          ];
        }
        encodedGovAction = [3, encodedGovActionId];
        break;
      }
      case GovActionType.UPDATE_COMMITTEE_ACTION: {
        let encodedGovActionId: EncodedGovActionId | null = null;
        if (pp.govAction.action.prevActionId) {
          encodedGovActionId = [
            pp.govAction.action.prevActionId.txId,
            pp.govAction.action.prevActionId.index,
          ];
        }

        const encodedRemovedColdCreds = pp.govAction.action.removeColdCreds.map((cred) => {
          return encodeCredential(cred);
        });

        const encodedAddColdCreds = new Map();
        for (const addColdCred of pp.govAction.action.addColdCreds) {
          encodedAddColdCreds.set(encodeCredential(addColdCred.credential), addColdCred.epoch);
        }

        encodedGovAction = [
          4,
          encodedGovActionId,
          encodedRemovedColdCreds,
          encodedAddColdCreds,
          new cbors.CborTag(pp.govAction.action.threshold, 30),
        ];
        break;
      }
      case GovActionType.NEW_CONSTITUTION_ACTION: {
        let encodedGovActionId: EncodedGovActionId | null = null;
        if (pp.govAction.action.prevActionId) {
          encodedGovActionId = [
            pp.govAction.action.prevActionId.txId,
            pp.govAction.action.prevActionId.index,
          ];
        }

        const encodedConstitution: EncodedConstitution = [
          encodeAnchor(pp.govAction.action.constitution.anchor),
          pp.govAction.action.constitution.scriptHash,
        ];

        encodedGovAction = [5, encodedGovActionId, encodedConstitution];
        break;
      }
      case GovActionType.INFO_ACTION: {
        encodedGovAction = [6];
        break;
      }
      default:
        throw new Error("Unknown type of gov action");
    }
    encodedProposalProcedures.push([
      pp.deposit,
      pp.rewardAccount,
      encodedGovAction,
      encodeAnchor(pp.anchor),
    ]);
  }
};
