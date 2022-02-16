/* eslint-disable no-use-before-define */
import { Buffer } from "buffer";
import * as cbors from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import _ from "lodash";
import { encodeLanguageViews } from "./encoder";
import { LanguageView, NativeScript, Token, WitnessType } from "../types";
import { hash32 } from "./crypto";
import { EncodedWitnesses } from "../internal-types";

/**
 * returns unique tokens with sum of amount for same tokens
 */
export const getUniqueTokens = (tokens: Array<Token>): Array<Token> => {
  return _(tokens)
    .groupBy(({ policyId }) => policyId)
    .map((policyMap, policyId) =>
      _(policyMap)
        .groupBy(({ assetName }) => assetName)
        .map((assetArray, assetName) => ({
          policyId,
          assetName,
          amount: assetArray.reduce((acc, asset) => acc.plus(asset.amount), new BigNumber(0)),
        }))
        .value()
    )
    .flatten()
    .value();
};

export const getTokenDiff = (
  inputToken: Array<Token>,
  outputTokens: Array<Token>
): Array<Token> => {
  const negativeValueOutputTokens = _.map(outputTokens, (token) => ({
    ...token,
    amount: token.amount.negated(),
  }));

  return getUniqueTokens(inputToken.concat(negativeValueOutputTokens)).filter((token) =>
    token.amount.abs().gt(0)
  );
};

export const sanitizeMetadata = (metadata: unknown): unknown => {
  if (metadata instanceof Array) {
    const ary = [];
    for (const d of metadata) {
      ary.push(sanitizeMetadata(d));
    }
    return ary;
  }
  if (typeof metadata === "string" || metadata instanceof Buffer) {
    if (metadata.length > 64) {
      throw new Error("string or buffer length invalid");
    }
    return metadata;
  }
  // TODO: map is also an object, hence check map first, maybe requires a proper fix
  if (metadata instanceof Map) {
    const map = new Map();
    for (const [key, value] of metadata.entries()) {
      map.set(key, sanitizeMetadata(value));
    }
    return map;
  }
  if (metadata instanceof Object) {
    const map = new Map();
    for (const [key, value] of Object.entries(metadata)) {
      map.set(key, sanitizeMetadata(value));
    }
    return map;
  }
  return metadata;
};

export const compareCanonically = (str1: string, str2: string): number =>
  str1.length - str2.length || str1.localeCompare(str2);

export const sortTokens = (tokens: Array<Token>): Array<Token> => {
  const sortedTokens = _(tokens)
    .orderBy(["policyId", "assetName"], ["asc", "asc"])
    .sort((token1, token2) => compareCanonically(token1.assetName, token2.assetName))
    .sort((token1, token2) => compareCanonically(token1.policyId, token2.policyId))
    .value();
  return sortedTokens;
};

export const generateScriptDataHash = (
  witnesses: EncodedWitnesses,
  languageView: LanguageView
): Buffer | undefined => {
  const encodedPlutusDataList = witnesses.get(WitnessType.PLUTUS_DATA);
  const encodedRedeemers = witnesses.get(WitnessType.REDEEMER);

  if (encodedPlutusDataList || encodedRedeemers) {
    const encodedPlutusScripts = witnesses.get(WitnessType.PLUTUS_SCRIPT);
    const langViewCbor = encodeLanguageViews(languageView, encodedPlutusScripts);

    const plutusDataCbor = encodedPlutusDataList?.length
      ? cbors.Encoder.encode(encodedPlutusDataList).toString("hex")
      : "";

    const redeemerCbor = encodedRedeemers
      ? cbors.Encoder.encode(encodedRedeemers).toString("hex")
      : cbors.Encoder.encode([]).toString("hex");

    const scriptData = Buffer.from(redeemerCbor + plutusDataCbor + langViewCbor, "hex");
    return hash32(scriptData);
  }
  return undefined;
};

const getPubKeyHashFromNativeScripts = (nativeScripts: Array<NativeScript>) => {
  let pubKeyHashList: Array<string> = [];
  for (const ns of nativeScripts) {
    const result = getPubKeyHashListFromNativeScript(ns);
    pubKeyHashList = _.concat(pubKeyHashList, _.flatten(result));
  }
  return pubKeyHashList;
};

export const getPubKeyHashListFromNativeScript = (nativeScript: any): Array<string> => {
  let pubKeyHashList: Array<string> = [];
  if (nativeScript.pubKeyHash) {
    pubKeyHashList.push(nativeScript.pubKeyHash);
  } else if (nativeScript.all) {
    const result = getPubKeyHashFromNativeScripts(nativeScript.all);
    pubKeyHashList = _.concat(pubKeyHashList, _.flatten(result));
  } else if (nativeScript.any) {
    const result = getPubKeyHashFromNativeScripts(nativeScript.any);
    pubKeyHashList = _.concat(pubKeyHashList, _.flatten(result));
  } else if (nativeScript.n) {
    const result = getPubKeyHashFromNativeScripts(nativeScript.k);
    pubKeyHashList = _.concat(pubKeyHashList, _.flatten(result));
  }
  return pubKeyHashList;
};
