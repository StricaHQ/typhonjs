import { Buffer } from "buffer";
import * as cbors from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import _ = require("lodash");
import bs58 from "bs58";
import { bech32 } from "bech32";
import { maxTokenAmount } from "../constants";
import BaseAddress from "../address/BaseAddress";
import ByronAddress from "../address/ByronAddress";
import EnterpriseAddress from "../address/EnterpriseAddress";
import PointerAddress from "../address/PointerAddress";
import { getUniqueTokens } from "./helpers";
import {
  NetworkId,
  ShelleyAddress,
  Token,
  Credential,
  HashType,
  CardanoAddress,
  AuxiliaryData,
  PlutusData,
} from "../types";
import RewardAddress from "../address/RewardAddress";
import { encodeAuxiliaryData, encodePlutusData } from "./encoder";
import { TokenBundle } from "../internal-types";

export const calculateMinUtxoAmount = (
  tokens: Array<Token>,
  lovelacePerUtxoWord: BigNumber,
  hasPlutusDataHash?: boolean
): BigNumber => {
  const uniqueTokens = getUniqueTokens(tokens);
  const roundupBytesToWords = (x: number) => Math.floor((x + 7) / 8);
  const coinSize = 2;
  let utxoEntrySizeWithoutVal = 27;
  if (hasPlutusDataHash) {
    utxoEntrySizeWithoutVal += 10;
  }
  const adaOnlyUtxoSize = utxoEntrySizeWithoutVal + coinSize;

  const tokenBundle = _(uniqueTokens)
    .groupBy(({ policyId }) => policyId)
    .value() as TokenBundle;

  const uniqueAssetNames = uniqueTokens.reduce((result: Record<string, boolean>, token) => {
    result[token.assetName] = true;
    return result;
  }, {});

  const policyCount = _.reduce(
    tokenBundle,
    (result) => {
      result += 1;
      return result;
    },
    0
  );

  const assetNameSize = _.reduce(
    uniqueAssetNames,
    (sum, status, assetName) => sum + Math.max(Buffer.from(assetName, "hex").length, 1),
    0
  );

  const policyIdSize = 28;

  const size =
    6 + roundupBytesToWords(uniqueTokens.length * 12 + assetNameSize + policyCount * policyIdSize);

  const minUtxo = lovelacePerUtxoWord.toNumber() * adaOnlyUtxoSize;

  if (uniqueTokens.length === 0) {
    return new BigNumber(minUtxo);
  }
  const minUtxoWithTokens = lovelacePerUtxoWord.toNumber() * (utxoEntrySizeWithoutVal + size);
  return BigNumber.max(minUtxo, minUtxoWithTokens);
};

export const getAddressFromHex = (hexAddress: string): ShelleyAddress | RewardAddress => {
  const typeHex = hexAddress.toLowerCase().charAt(0);
  const networkId = Number(hexAddress.toLowerCase().charAt(1)) as NetworkId;
  let stakeCredential: Credential;
  let paymentCredential: Credential;
  switch (typeHex) {
    case "e":
      stakeCredential = {
        hash: hexAddress.slice(2).slice(0, 56),
        type: HashType.ADDRESS,
      };
      return new RewardAddress(networkId, stakeCredential);
    case "f":
      stakeCredential = {
        hash: hexAddress.slice(2).slice(0, 56),
        type: HashType.SCRIPT,
      };
      return new RewardAddress(networkId, stakeCredential);
    case "7": {
      paymentCredential = {
        hash: hexAddress.slice(2),
        type: HashType.SCRIPT,
      };
      return new EnterpriseAddress(networkId, paymentCredential);
    }
    case "6": {
      paymentCredential = {
        hash: hexAddress.slice(2),
        type: HashType.ADDRESS,
      };
      return new EnterpriseAddress(networkId, paymentCredential);
    }
    case "5": {
      paymentCredential = {
        hash: hexAddress.slice(2).slice(0, 56),
        type: HashType.SCRIPT,
      };
      const vlq = hexAddress.slice(2).slice(56);
      return new PointerAddress(networkId, paymentCredential, vlq);
    }
    case "4": {
      paymentCredential = {
        hash: hexAddress.slice(2).slice(0, 56),
        type: HashType.ADDRESS,
      };
      const vlq = hexAddress.slice(2).slice(56);
      return new PointerAddress(networkId, paymentCredential, vlq);
    }
    case "3":
      paymentCredential = {
        hash: hexAddress.slice(2).slice(0, 56),
        type: HashType.SCRIPT,
      };
      stakeCredential = {
        hash: hexAddress.slice(2).slice(56),
        type: HashType.SCRIPT,
      };
      return new BaseAddress(networkId, paymentCredential, stakeCredential);
    case "2":
      paymentCredential = {
        hash: hexAddress.slice(2).slice(0, 56),
        type: HashType.ADDRESS,
      };
      stakeCredential = {
        hash: hexAddress.slice(2).slice(56),
        type: HashType.SCRIPT,
      };
      return new BaseAddress(networkId, paymentCredential, stakeCredential);
    case "1":
      paymentCredential = {
        hash: hexAddress.slice(2).slice(0, 56),
        type: HashType.SCRIPT,
      };
      stakeCredential = {
        hash: hexAddress.slice(2).slice(56),
        type: HashType.ADDRESS,
      };
      return new BaseAddress(networkId, paymentCredential, stakeCredential);
    case "0":
      paymentCredential = {
        hash: hexAddress.slice(2).slice(0, 56),
        type: HashType.ADDRESS,
      };
      stakeCredential = {
        hash: hexAddress.slice(2).slice(56),
        type: HashType.ADDRESS,
      };
      return new BaseAddress(networkId, paymentCredential, stakeCredential);
    default:
      throw new Error("Unsupported address type");
  }
};

export const decodeBech32 = (bech32Address: string): { prefix: string; value: string } => {
  const decoded = bech32.decode(bech32Address, 114);
  const decodedBech = bech32.fromWords(decoded.words);
  const decodedAddress = Buffer.from(decodedBech).toString("hex");
  return {
    prefix: decoded.prefix,
    value: decodedAddress,
  };
};

export const getAddressFromBech32 = (bech32Address: string): CardanoAddress => {
  try {
    const byronAddress = bs58.decode(bech32Address);
    return new ByronAddress(byronAddress);
  } catch (error) {
    try {
      const hexAddress = decodeBech32(bech32Address).value;
      return getAddressFromHex(hexAddress);
    } catch (err) {
      throw new Error("Invalid Address");
    }
  }
};

export const getMaximumTokenSets = (oTokens: Array<Token>): Array<Array<Token>> => {
  const tokens = _.cloneDeep(oTokens);
  const result: Array<Array<Token>> = [];
  while (tokens.length > 0) {
    const tokenArray: Array<Token> = [];
    const tokenLengthFixed = tokens.length;
    for (let i = 0; i < tokenLengthFixed; i += 1) {
      const token = tokens.pop() as Token;
      if (token.amount.lte(maxTokenAmount)) {
        tokenArray.push(token);
      } else {
        tokenArray.push({
          assetName: token.assetName,
          policyId: token.policyId,
          amount: new BigNumber(maxTokenAmount),
        });
        token.amount = token.amount.minus(maxTokenAmount);
        tokens.push(token);
      }
    }
    result.push(tokenArray);
  }
  return result;
};

export const createAuxiliaryDataCbor = (auxiliaryData: AuxiliaryData): Buffer => {
  const encodedAuxData = encodeAuxiliaryData(auxiliaryData);
  return cbors.Encoder.encode(encodedAuxData);
};

export const createPlutusDataCbor = (plutusData: PlutusData): Buffer => {
  const encodedPlutusData = encodePlutusData(plutusData);
  return cbors.Encoder.encode(encodedPlutusData);
};
