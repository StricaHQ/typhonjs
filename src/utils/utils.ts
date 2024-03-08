import { Buffer } from "buffer";
import * as cbors from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import _ = require("lodash");
import bs58 from "bs58";
import { bech32 } from "bech32";
import { maxAdaAmount, maxTokenAmount } from "../constants";
import BaseAddress from "../address/BaseAddress";
import ByronAddress from "../address/ByronAddress";
import EnterpriseAddress from "../address/EnterpriseAddress";
import PointerAddress from "../address/PointerAddress";
import { getUniqueTokens } from "./helpers";
import {
  NetworkId,
  Token,
  Credential,
  HashType,
  CardanoAddress,
  AuxiliaryData,
  PlutusData,
  Output,
} from "../types";
import RewardAddress from "../address/RewardAddress";
import { encodeAuxiliaryData, encodeOutput, encodePlutusData, encodeOutputTokens } from "./encoder";
import { EncodedAmount, TokenBundle } from "../internal-types";

export const getOutputValueSize = (adaAmount: BigNumber, tokens: Array<Token>): number => {
  const encodedAmount: EncodedAmount =
    tokens.length > 0 ? [adaAmount, encodeOutputTokens(tokens)] : adaAmount;
  return cbors.Encoder.encode(encodedAmount).byteLength;
};

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

export const calculateMinUtxoAmountBabbage = (
  output: Output,
  utxoCostPerByte: BigNumber
): BigNumber => {
  const minADA = new BigNumber(
    160 + cbors.Encoder.encode(encodeOutput(output)).length
  ).multipliedBy(utxoCostPerByte);
  return minADA;
};

export const getAddressFromHex = (hexAddress: Buffer): CardanoAddress => {
  const hexAddressString = hexAddress.toString("hex");
  const typeHex = hexAddressString.toLowerCase().charAt(0);
  const networkId = Number(hexAddressString.toLowerCase().charAt(1)) as NetworkId;
  let stakeCredential: Credential;
  let paymentCredential: Credential;
  switch (typeHex) {
    case "e":
      stakeCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(0, 56), "hex"),
        type: HashType.ADDRESS,
      };
      return new RewardAddress(networkId, stakeCredential);
    case "f":
      stakeCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(0, 56), "hex"),
        type: HashType.SCRIPT,
      };
      return new RewardAddress(networkId, stakeCredential);
    case "7": {
      paymentCredential = {
        hash: Buffer.from(hexAddressString.slice(2), "hex"),
        type: HashType.SCRIPT,
      };
      return new EnterpriseAddress(networkId, paymentCredential);
    }
    case "6": {
      paymentCredential = {
        hash: Buffer.from(hexAddressString.slice(2), "hex"),
        type: HashType.ADDRESS,
      };
      return new EnterpriseAddress(networkId, paymentCredential);
    }
    case "5": {
      paymentCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(0, 56), "hex"),
        type: HashType.SCRIPT,
      };
      const vlq = hexAddressString.slice(2).slice(56);
      return new PointerAddress(networkId, paymentCredential, vlq);
    }
    case "4": {
      paymentCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(0, 56), "hex"),
        type: HashType.ADDRESS,
      };
      const vlq = hexAddressString.slice(2).slice(56);
      return new PointerAddress(networkId, paymentCredential, vlq);
    }
    case "3":
      paymentCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(0, 56), "hex"),
        type: HashType.SCRIPT,
      };
      stakeCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(56), "hex"),
        type: HashType.SCRIPT,
      };
      return new BaseAddress(networkId, paymentCredential, stakeCredential);
    case "2":
      paymentCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(0, 56), "hex"),
        type: HashType.ADDRESS,
      };
      stakeCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(56), "hex"),
        type: HashType.SCRIPT,
      };
      return new BaseAddress(networkId, paymentCredential, stakeCredential);
    case "1":
      paymentCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(0, 56), "hex"),
        type: HashType.SCRIPT,
      };
      stakeCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(56), "hex"),
        type: HashType.ADDRESS,
      };
      return new BaseAddress(networkId, paymentCredential, stakeCredential);
    case "0":
      paymentCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(0, 56), "hex"),
        type: HashType.ADDRESS,
      };
      stakeCredential = {
        hash: Buffer.from(hexAddressString.slice(2).slice(56), "hex"),
        type: HashType.ADDRESS,
      };
      return new BaseAddress(networkId, paymentCredential, stakeCredential);
    case "8":
      return new ByronAddress(hexAddress);
    default:
      throw new Error("Unsupported address type");
  }
};

export const decodeBech32 = (bech32Address: string): { prefix: string; value: Buffer } => {
  const decoded = bech32.decode(bech32Address, 114);
  const decodedBech = bech32.fromWords(decoded.words);
  const decodedAddress = Buffer.from(decodedBech);
  return {
    prefix: decoded.prefix,
    value: decodedAddress,
  };
};

export const getAddressFromString = (address: string): CardanoAddress => {
  try {
    const byronAddress = Buffer.from(bs58.decode(address));
    try {
      cbors.Decoder.decode(byronAddress);
    } catch (e) {
      throw new Error("Invalid Byron Address");
    }
    return new ByronAddress(byronAddress);
  } catch (error) {
    try {
      const decodeAddr = decodeBech32(address);
      if (
        decodeAddr.prefix === "addr" ||
        decodeAddr.prefix === "addr_test" ||
        decodeAddr.prefix === "stake" ||
        decodeAddr.prefix === "stake_test"
      ) {
        return getAddressFromHex(decodeAddr.value);
      }
      throw new Error("Invalid Address");
    } catch (err) {
      throw new Error("Invalid Address");
    }
  }
};

export const getMaximumTokenSets = (
  oTokens: Array<Token>,
  maxValueSizePP: number
): Array<Array<Token>> => {
  const tokens = _.cloneDeep(oTokens);
  const result: Array<Array<Token>> = [];
  while (tokens.length > 0) {
    const tokenArray: Array<Token> = [];
    const tokenLengthFixed = tokens.length;
    for (let i = 0; i < tokenLengthFixed; i += 1) {
      const token = tokens.shift() as Token;
      if (token) {
        // set default value as full token
        let newToken = token;
        // if the token amount is more than the max amount (int), only use max amount token
        // add remaining amount of tokens into another output set
        if (token.amount.gte(maxTokenAmount)) {
          newToken = {
            assetName: token.assetName,
            policyId: token.policyId,
            amount: new BigNumber(maxTokenAmount),
          };
        }

        // calculate the current token set size
        const tokenArrayOutputSize = getOutputValueSize(new BigNumber(maxAdaAmount), [
          ...tokenArray,
          newToken,
        ]);

        // only add the token to the current set if its under maxValueSize limit
        if (tokenArrayOutputSize < maxValueSizePP) {
          tokenArray.push(newToken);

          // if the above token used in this set had max value
          // add the remaining token amount for the next set
          if (token.amount.gte(maxTokenAmount)) {
            token.amount = token.amount.minus(maxTokenAmount);
            tokens.push(token);
          }
        } else {
          // add the popped token back to main list, since it didn't make it into the current set
          tokens.push(token);
        }
        // while modifying this func, make sure to handle the case above, no logic must follow this line
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
