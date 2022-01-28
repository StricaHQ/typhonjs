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
  HashType,
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
  TokenBundle,
  VKeyWitness,
  Withdrawal,
  PlutusScriptType,
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
  EncodedStakeCredential,
  EncodedStakeDelegationCertificate,
  EncodedStakeDeRegistrationCertificate,
  EncodedStakeRegistrationCertificate,
  EncodedTokens,
  EncodedVKeyWitness,
  EncodedWithdrawals,
  EncodedWitnesses,
  RedeemerTag,
} from "../internal-types";

export const encodeInputs = (inputs: Array<Input>): Array<EncodedInput> => {
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

export const encodeOutputs = (outputs: Array<Output>): Array<EncodedOutput> => {
  const encodedOutputs: Array<EncodedOutput> = outputs.map((output) => {
    const amount: EncodedAmount =
      output.tokens.length > 0 ? [output.amount, encodeOutputTokens(output.tokens)] : output.amount;

    const result: EncodedOutput = [output.address.getBytes(), amount];
    let plutusDataHash = output.plutusDataHash
      ? Buffer.from(output.plutusDataHash, "hex")
      : undefined;
    if (output.plutusData) {
      const encodedPlutusData = cbors.Encoder.encode(encodePlutusData(output.plutusData));
      plutusDataHash = hash32(encodedPlutusData);
    }
    if (plutusDataHash) {
      result.push(plutusDataHash);
    }
    return result;
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

export const encodeStakeRegistrationCertificate = (
  certificate: StakeRegistrationCertificate
): EncodedStakeRegistrationCertificate => {
  const stakeKeyHash: Buffer = Buffer.from(certificate.stakeCredential.hash, "hex");
  const stakeCredential: EncodedStakeCredential = [certificate.stakeCredential.type, stakeKeyHash];
  return [CertificateType.STAKE_REGISTRATION, stakeCredential];
};

export const encodeStakeDeRegistrationCertificate = (
  certificate: StakeDeRegistrationCertificate
): EncodedStakeDeRegistrationCertificate => {
  const stakeKeyHash: Buffer = Buffer.from(certificate.stakeCredential.hash, "hex");
  const stakeCredential: EncodedStakeCredential = [certificate.stakeCredential.type, stakeKeyHash];
  return [CertificateType.STAKE_DE_REGISTRATION, stakeCredential];
};

export const encodeStakeDelegationCertificate = (
  certificate: StakeDelegationCertificate
): EncodedStakeDelegationCertificate => {
  const stakeKeyHash: Buffer = Buffer.from(certificate.stakeCredential.hash, "hex");
  const stakeCredential: EncodedStakeCredential = [certificate.stakeCredential.type, stakeKeyHash];
  const poolHash = Buffer.from(certificate.poolHash, "hex");
  return [CertificateType.STAKE_DELEGATION, stakeCredential, poolHash];
};

export const encodeCertificates = (certificates: Array<Certificate>): Array<EncodedCertificate> => {
  const encodedCertificates: Array<EncodedCertificate> = [];

  certificates.forEach((certificate) => {
    switch (certificate.certType) {
      case CertificateType.STAKE_REGISTRATION:
        encodedCertificates.push(encodeStakeRegistrationCertificate(certificate));
        break;
      case CertificateType.STAKE_DE_REGISTRATION:
        encodedCertificates.push(encodeStakeDeRegistrationCertificate(certificate));
        break;
      case CertificateType.STAKE_DELEGATION:
        encodedCertificates.push(encodeStakeDelegationCertificate(certificate));
        break;
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
  plutusDataList: Array<PlutusDataConstructor>
): EncodedWitnesses => {
  const encodedWitnesses: EncodedWitnesses = new Map();
  encodedWitnesses.set(WitnessType.V_KEY_WITNESS, encodeVKeyWitness(vKeyWitness));

  const sortedInputs = _.orderBy(inputs, ["txId", "index"], ["asc", "asc"]);
  const encodedRedeemers: Array<EncodedRedeemer> = [];
  const plutusScriptMap: Map<string, PlutusScriptType> = new Map();
  const encodedPlutusDataMap: Map<string, EncodedPlutusData> = new Map();

  if (plutusDataList.length > 0) {
    for (const d of plutusDataList) {
      const encodedPlutusData = encodePlutusData(d);
      const edCbor = cbors.Encoder.encode(encodedPlutusData);
      const edHash = hash32(edCbor);
      encodedPlutusDataMap.set(edHash.toString("hex"), encodedPlutusData);
    }
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
    if (input.address.paymentCredential.type === HashType.SCRIPT) {
      if (input.address.paymentCredential.plutusScript) {
        plutusScriptMap.set(
          input.address.paymentCredential.plutusScript.cborHex,
          input.address.paymentCredential.plutusScript.type
        );
      }
    }
    if (input.plutusData) {
      const encodedPlutusData = encodePlutusData(input.plutusData);
      const edCbor = cbors.Encoder.encode(encodedPlutusData);
      const edHash = hash32(edCbor);
      encodedPlutusDataMap.set(edHash.toString("hex"), encodedPlutusData);
    }
  }
  const encodedPlutusDataList: EncodedPlutusData = [];
  for (const [, encodedPlutusData] of encodedPlutusDataMap) {
    encodedPlutusDataList.push(encodedPlutusData);
  }
  const encodedPlutusScriptsV1: Array<EncodedPlutusScript> = [];
  for (const [script, scriptType] of plutusScriptMap) {
    if (scriptType === PlutusScriptType.PlutusScriptV1) {
      const pls = cbors.Decoder.decode(Buffer.from(script, "hex"));
      encodedPlutusScriptsV1.push(pls.value);
    } else {
      throw new Error("Unsupported PlutusScript Version");
    }
  }
  if (encodedPlutusScriptsV1.length) {
    encodedWitnesses.set(WitnessType.PLUTUS_SCRIPT, encodedPlutusScriptsV1);
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
export const encodePlutusData = (plutusData: PlutusDataConstructor): EncodedPlutusData => {
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
        fields.push(encodePlutusDataTypes(field));
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
  const encodePlutusDataTypes = (subPlutusData: PlutusData): unknown => {
    if (subPlutusData instanceof Array) {
      const ary = [];
      for (const d of subPlutusData) {
        ary.push(encodePlutusDataTypes(d));
      }
      return ary;
    }
    if (subPlutusData instanceof Uint8Array) {
      return Buffer.from(subPlutusData);
    }
    if (subPlutusData instanceof Buffer || subPlutusData instanceof Uint8Array) {
      return subPlutusData;
    }
    if (typeof subPlutusData === "string") {
      throw new Error("String not supported in PlutusData");
    }
    // TODO: map is also an object, check map first, maybe requires a proper fix
    else if (subPlutusData instanceof Map) {
      const map = new Map();
      for (const [key, value] of subPlutusData.entries()) {
        map.set(key, encodePlutusDataTypes(value));
      }
      return map;
    } else if (subPlutusData instanceof Object) {
      const constructorObject = subPlutusData as PlutusDataConstructor;
      const constructor = createConstructor(constructorObject);
      return constructor;
    } else {
      return subPlutusData;
    }
  };

  if (plutusData instanceof Object) {
    const constructor = createConstructor(plutusData);
    return constructor;
  }
  throw new Error("Invalid PlutusData supplied");
};

export const encodeLanguageViews = (
  languageView: LanguageView,
  encodedPlutusScripts?: Array<EncodedPlutusScript>
): string => {
  const encodedLanguageView = new Map();

  if (encodedPlutusScripts && encodedPlutusScripts.length > 0) {
    // The encoding is Plutus V1 Specific
    const costMdls = _(languageView.PlutusScriptV1)
      .map((value, key) => ({
        key,
        value,
      }))
      .orderBy(["key"], ["asc"])
      .map((item) => item.value)
      .value();

    const indefCostMdls = cbors.IndefiniteArray.from(costMdls);
    const cborCostMdls = cbors.Encoder.encode(indefCostMdls);
    const langId = cbors.Encoder.encode(0);
    // Plutus V1
    encodedLanguageView.set(langId, cborCostMdls);
  }

  return cbors.Encoder.encode(encodedLanguageView).toString("hex");
};
