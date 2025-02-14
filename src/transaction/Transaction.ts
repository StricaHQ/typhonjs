import { Buffer } from "buffer";
import * as cbors from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import _ from "lodash";

import {
  generateScriptDataHash,
  getPubKeyHashListFromNativeScript,
  getUniqueTokens,
  sortTokens,
} from "../utils/helpers";

import {
  CardanoAddress,
  CertificateType,
  CollateralInput,
  HashCredential,
  HashType,
  Mint,
  NativeScript,
  PlutusData,
  PlutusScriptType,
  ProtocolParams,
  BipPath,
  AuxiliaryData,
  Certificate,
  Input,
  Output,
  Withdrawal,
  Token,
  VKeyWitness,
  ReferenceInput,
  VotingProcedure,
  ProposalProcedure,
} from "../types";
import {
  encodeAuxiliaryData,
  encodeCertificates,
  encodeCollaterals,
  encodeInputs,
  encodeMint,
  encodeOutput,
  encodeOutputs,
  encodeWithdrawals,
  encodeWitnesses,
  encodeNativeScript,
  encodeVotingProcedures,
  encodeProposalProcedures,
} from "../utils/encoder";
import { hash32 } from "../utils/crypto";
import { calculateMinUtxoAmountBabbage } from "../utils/utils";
import transactionBuilder from "./helpers/transactionBuilder";
import { paymentTransaction } from "./helpers/paymentTransaction";
import { TransactionBodyItemType } from "../internal-types";

export class Transaction {
  protected _protocolParams: ProtocolParams;

  protected inputs: Array<Input> = [];
  protected referenceInputs: Array<ReferenceInput> = [];
  protected outputs: Array<Output> = [];
  protected certificates: Array<Certificate> = [];
  protected withdrawals: Array<Withdrawal> = [];
  protected requiredWitnesses: Map<string, BipPath | undefined> = new Map();
  protected requiredNativeScriptWitnesses: Map<string, undefined> = new Map();
  protected fee: BigNumber = new BigNumber(5000000);
  protected ttl: number | undefined;
  protected witnesses: Array<VKeyWitness> = [];
  protected plutusScriptMap: Map<string, PlutusScriptType> = new Map();
  protected nativeScriptList: Array<NativeScript> = [];
  protected auxiliaryData: AuxiliaryData | undefined;
  protected collaterals: Array<CollateralInput> = [];
  protected collateralOutput: Output | undefined;
  protected totalCollateral: BigNumber | undefined;
  protected requiredSigners: Map<string, BipPath | undefined> = new Map();
  protected plutusDataList: Array<PlutusData> = [];
  protected _isPlutusV1Transaction = false;
  protected _isPlutusV2Transaction = false;
  protected _isPlutusV3Transaction = false;
  protected mints: Array<Mint> = [];
  protected validityIntervalStart: number | undefined;
  protected votingProcedures: Array<VotingProcedure> = [];
  protected proposalProcedures: Array<ProposalProcedure> = [];

  constructor({ protocolParams }: { protocolParams: ProtocolParams }) {
    this._protocolParams = protocolParams;
  }

  get protocolParams() {
    return this._protocolParams;
  }

  getTTL(): number | undefined {
    return this.ttl;
  }

  setTTL(ttl: number): void {
    this.ttl = ttl;
  }

  getValidityIntervalStart(): number | undefined {
    return this.validityIntervalStart;
  }

  setValidityIntervalStart(validityIntervalStart: number): void {
    this.validityIntervalStart = validityIntervalStart;
  }

  addInput(input: Input): void {
    if (input.address.paymentCredential.type === HashType.ADDRESS) {
      this.requiredWitnesses.set(
        input.address.paymentCredential.hash.toString("hex"),
        input.address.paymentCredential.bipPath
      );
    } else if (input.address.paymentCredential.type === HashType.SCRIPT) {
      if (input.address.paymentCredential.plutusScript) {
        this.plutusScriptMap.set(
          input.address.paymentCredential.plutusScript.cborHex,
          input.address.paymentCredential.plutusScript.type
        );
        if (input.address.paymentCredential.plutusScript.type === PlutusScriptType.PlutusScriptV1) {
          this._isPlutusV1Transaction = true;
        }
        if (input.address.paymentCredential.plutusScript.type === PlutusScriptType.PlutusScriptV2) {
          this._isPlutusV2Transaction = true;
        }
        if (input.address.paymentCredential.plutusScript.type === PlutusScriptType.PlutusScriptV3) {
          this._isPlutusV3Transaction = true;
        }
      } else if (input.address.paymentCredential.nativeScript) {
        const nativeScript = input.address.paymentCredential.nativeScript;
        const pubKeyHashList = getPubKeyHashListFromNativeScript(nativeScript);
        for (const pkh of pubKeyHashList) {
          this.requiredNativeScriptWitnesses.set(pkh, undefined);
        }
        this.nativeScriptList.push(nativeScript);
      }
    }
    if (input.plutusData) {
      this.plutusDataList.push(input.plutusData);
    }
    this.inputs.push(input);
  }

  addReferenceInput(input: ReferenceInput): void {
    if (
      input.address &&
      input.address.paymentCredential.type === HashType.SCRIPT &&
      input.address.paymentCredential.plutusScript
    ) {
      if (input.address.paymentCredential.plutusScript.type === PlutusScriptType.PlutusScriptV1) {
        this._isPlutusV1Transaction = true;
      }
      if (input.address.paymentCredential.plutusScript.type === PlutusScriptType.PlutusScriptV2) {
        this._isPlutusV2Transaction = true;
      }
      if (input.address.paymentCredential.plutusScript.type === PlutusScriptType.PlutusScriptV3) {
        this._isPlutusV3Transaction = true;
      }
    }
    this.referenceInputs.push(input);
  }

  addRequiredSigner(credential: HashCredential): void {
    this.requiredSigners.set(credential.hash.toString("hex"), credential.bipPath);
  }

  addCollateral(input: CollateralInput): void {
    if (input.address.paymentCredential.type === HashType.ADDRESS) {
      this.requiredWitnesses.set(
        input.address.paymentCredential.hash.toString("hex"),
        input.address.paymentCredential.bipPath
      );
    }
    this.collaterals.push(input);
  }

  addMint(mint: Mint): void {
    this.mints.push(mint);
    if (mint.plutusScript) {
      this.plutusScriptMap.set(mint.plutusScript.cborHex, mint.plutusScript.type);

      if (mint.plutusScript.type === PlutusScriptType.PlutusScriptV1) {
        this._isPlutusV1Transaction = true;
      }
      if (mint.plutusScript.type === PlutusScriptType.PlutusScriptV2) {
        this._isPlutusV2Transaction = true;
      }
      if (mint.plutusScript.type === PlutusScriptType.PlutusScriptV3) {
        this._isPlutusV3Transaction = true;
      }
    } else if (mint.nativeScript) {
      // used to guesstimate fees by required pkh witnesses inside nativescript
      // this flow can be improved in future version
      const pubKeyHashList = getPubKeyHashListFromNativeScript(mint.nativeScript);
      for (const pkh of pubKeyHashList) {
        this.requiredNativeScriptWitnesses.set(pkh, undefined);
      }
      this.nativeScriptList.push(mint.nativeScript);
    }
  }

  /**
   * The method will add a certificate to the transaction to be included in cbor
   * This method will automatically scan and include each unique required witnesses in the map
   * to help sign the transaction
   * @param certificate a certificate to include in the transaction
   */
  addCertificate(certificate: Certificate): void {
    switch (certificate.type) {
      case CertificateType.STAKE_DELEGATION: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.STAKE_REGISTRATION: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.STAKE_DE_REGISTRATION: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.STAKE_KEY_REGISTRATION: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.STAKE_KEY_DE_REGISTRATION: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.VOTE_DELEGATION: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.STAKE_VOTE_DELEG: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.STAKE_REG_DELEG: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.VOTE_REG_DELEG: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.STAKE_VOTE_REG_DELEG: {
        if (certificate.cert.stakeCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.stakeCredential.hash.toString("hex"),
            certificate.cert.stakeCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.DREP_REG: {
        if (certificate.cert.dRepCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.dRepCredential.hash.toString("hex"),
            certificate.cert.dRepCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.DREP_DE_REG: {
        if (certificate.cert.dRepCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.dRepCredential.hash.toString("hex"),
            certificate.cert.dRepCredential.bipPath
          );
        }
        break;
      }
      case CertificateType.DREP_UPDATE: {
        if (certificate.cert.dRepCredential.type === HashType.ADDRESS) {
          this.requiredWitnesses.set(
            certificate.cert.dRepCredential.hash.toString("hex"),
            certificate.cert.dRepCredential.bipPath
          );
        }
        break;
      }
      default:
        break;
    }

    this.certificates.push(certificate);
  }

  addOutput(output: Output): void {
    const uOutput = output;
    uOutput.tokens = sortTokens(uOutput.tokens);
    this.outputs.push(uOutput);
    if (uOutput.plutusData) {
      this.plutusDataList.push(uOutput.plutusData);
    }
  }

  addWithdrawal(withdrawal: Withdrawal): void {
    if (withdrawal.rewardAccount.stakeCredential.type === HashType.ADDRESS) {
      this.requiredWitnesses.set(
        withdrawal.rewardAccount.stakeCredential.hash.toString("hex"),
        withdrawal.rewardAccount.stakeCredential.bipPath
      );
    }
    this.withdrawals.push(withdrawal);
  }

  // add voting procedure to the transaction, used to vote on a governance proposal
  addVotingProcedure(votingProcedure: VotingProcedure): void {
    if (votingProcedure.voter.key.type === HashType.ADDRESS) {
      this.requiredWitnesses.set(
        votingProcedure.voter.key.hash.toString("hex"),
        votingProcedure.voter.key.bipPath
      );
    }
    this.votingProcedures.push(votingProcedure);
  }

  addProposalProcedure(proposalProcedure: ProposalProcedure): void {
    // no additional signatures required to submit a governance action
    this.proposalProcedures.push(proposalProcedure);
  }

  setCollateralOutput(output: Output): void {
    const uOutput = output;
    uOutput.tokens = sortTokens(uOutput.tokens);
    this.collateralOutput = uOutput;
    if (uOutput.plutusData) {
      this.plutusDataList.push(uOutput.plutusData);
    }
  }

  getCollateralOutput(): Output | undefined {
    return this.collateralOutput;
  }

  setTotalCollateral(amount: BigNumber): void {
    this.totalCollateral = amount;
  }

  getTotalCollateral(): BigNumber | undefined {
    return this.totalCollateral;
  }

  /**
   * This method will encode the transaction body to be included in the cbor
   */
  protected transactionBody({
    extraOutputs,
    scriptDataHash,
  }: {
    extraOutputs?: Array<Output>;
    scriptDataHash?: Buffer;
  }): unknown {
    const encodedBody = new Map<TransactionBodyItemType, unknown>();
    encodedBody.set(TransactionBodyItemType.INPUTS, encodeInputs(this.inputs));
    let trxOutputs = this.outputs;
    if (extraOutputs && extraOutputs.length > 0) {
      trxOutputs = trxOutputs.concat(extraOutputs);
    }
    encodedBody.set(TransactionBodyItemType.OUTPUTS, encodeOutputs(trxOutputs));
    encodedBody.set(TransactionBodyItemType.FEE, this.fee);
    if (this.ttl !== undefined) {
      encodedBody.set(TransactionBodyItemType.TTL, this.ttl);
    }
    if (this.certificates.length > 0) {
      encodedBody.set(TransactionBodyItemType.CERTIFICATES, encodeCertificates(this.certificates));
    }
    if (this.withdrawals.length > 0) {
      encodedBody.set(TransactionBodyItemType.WITHDRAWALS, encodeWithdrawals(this.withdrawals));
    }
    if (this.auxiliaryData) {
      const encodedAuxiliaryData = encodeAuxiliaryData(this.auxiliaryData);
      const auxiliaryDataCbor = cbors.Encoder.encode(encodedAuxiliaryData);
      const auxiliaryDataHash = hash32(auxiliaryDataCbor);
      encodedBody.set(TransactionBodyItemType.AUXILIARY_DATA_HASH, auxiliaryDataHash);
    }
    if (this.validityIntervalStart !== undefined) {
      encodedBody.set(TransactionBodyItemType.VALIDITY_INTERVAL_START, this.validityIntervalStart);
    }
    if (!_.isEmpty(this.mints)) {
      encodedBody.set(TransactionBodyItemType.MINT, encodeMint(this.mints));
    }
    if (scriptDataHash) {
      encodedBody.set(TransactionBodyItemType.SCRIPT_DATA_HASH, scriptDataHash);
    }
    if (!_.isEmpty(this.collaterals)) {
      encodedBody.set(
        TransactionBodyItemType.COLLATERAL_INPUTS,
        encodeCollaterals(this.collaterals)
      );
    }
    const requiredSigners = Array.from(this.requiredSigners.keys());
    if (!_.isEmpty(requiredSigners)) {
      encodedBody.set(
        TransactionBodyItemType.REQUIRED_SIGNERS,
        requiredSigners.map((key) => Buffer.from(key, "hex"))
      );
    }
    if (this.collateralOutput) {
      encodedBody.set(
        TransactionBodyItemType.COLLATERAL_OUTPUT,
        encodeOutput(this.collateralOutput)
      );
    }
    if (this.totalCollateral) {
      encodedBody.set(TransactionBodyItemType.TOTAL_COLLATERAL, this.totalCollateral);
    }
    if (!_.isEmpty(this.referenceInputs)) {
      encodedBody.set(TransactionBodyItemType.REFERENCE_INPUTS, encodeInputs(this.referenceInputs));
    }

    if (!_.isEmpty(this.votingProcedures)) {
      encodedBody.set(
        TransactionBodyItemType.VOTING_PROCEDURES,
        encodeVotingProcedures(this.votingProcedures)
      );
    }

    if (!_.isEmpty(this.proposalProcedures)) {
      encodedBody.set(
        TransactionBodyItemType.PROPOSAL_PROCEDURES,
        encodeProposalProcedures(this.proposalProcedures)
      );
    }

    return encodedBody;
  }

  private transactionFee(size: number): BigNumber {
    return new BigNumber(size)
      .times(this._protocolParams.minFeeA)
      .plus(this._protocolParams.minFeeB)
      .integerValue(BigNumber.ROUND_CEIL);
  }

  private contractFee(): BigNumber {
    let totalMem = 0;
    let totalSteps = 0;

    for (const input of this.inputs) {
      if (input.redeemer) {
        totalMem += input.redeemer.exUnits.mem;
        totalSteps += input.redeemer.exUnits.steps;
      }
    }

    for (const mint of this.mints) {
      if (mint.redeemer) {
        totalMem += mint.redeemer.exUnits.mem;
        totalSteps += mint.redeemer.exUnits.steps;
      }
    }

    const memPrice = new BigNumber(totalMem).times(this._protocolParams.priceMem);
    const stepsPrice = new BigNumber(totalSteps).times(this._protocolParams.priceSteps);
    return memPrice.plus(stepsPrice).integerValue(BigNumber.ROUND_CEIL);
  }

  private calculateRefScriptFee(): number {
    const sizeIncrement = 25600;
    const multiplier = 1.2;
    const minFeeRefScriptCostPerByte = this._protocolParams.minFeeRefScriptCostPerByte;

    const calculate = (acc: number, curTierPrice: number, size: number): number => {
      if (size < sizeIncrement) {
        return Math.floor(acc + size * curTierPrice);
      }
      const acc_ = acc + curTierPrice * sizeIncrement;
      return calculate(acc_, multiplier * curTierPrice, size - sizeIncrement);
    };

    const getNSSize = (nativeScript: NativeScript): number => {
      const encodedNativeScript = cbors.Encoder.encode(encodeNativeScript(nativeScript));
      return encodedNativeScript.length;
    };

    const getPSSize = (plutusScriptHex: string): number => {
      return Buffer.from(plutusScriptHex, "hex").length;
    };

    let totalRefScriptSize = 0;
    for (const input of this.inputs) {
      if (input.nativeScript) {
        totalRefScriptSize += getNSSize(input.nativeScript);
      }
      if (input.plutusScript) {
        totalRefScriptSize += getPSSize(input.plutusScript.cborHex);
      }
    }

    for (const input of this.referenceInputs) {
      if (input.nativeScript) {
        totalRefScriptSize += getNSSize(input.nativeScript);
      }
      if (input.plutusScript) {
        totalRefScriptSize += getPSSize(input.plutusScript.cborHex);
      }
    }

    if (totalRefScriptSize > 0) {
      return calculate(0, minFeeRefScriptCostPerByte, totalRefScriptSize);
    }
    return 0;
  }

  calculateTxSize(extraOutputs?: Array<Output>): number {
    const combinedRequiredWitnesses: Map<string, BipPath | undefined> = new Map();
    for (const [key, value] of this.requiredNativeScriptWitnesses.entries()) {
      combinedRequiredWitnesses.set(key, value);
    }
    for (const [key, value] of this.requiredSigners.entries()) {
      combinedRequiredWitnesses.set(key, value);
    }
    for (const [key, value] of this.requiredWitnesses.entries()) {
      combinedRequiredWitnesses.set(key, value);
    }

    const dummyWitnesses: Array<VKeyWitness> = [];
    for (const [index] of Array.from(combinedRequiredWitnesses.keys()).entries()) {
      dummyWitnesses.push({
        publicKey: Buffer.alloc(32, index),
        signature: Buffer.alloc(64),
      });
    }
    const encodedWitnesses = encodeWitnesses(
      dummyWitnesses,
      this.inputs,
      this.plutusDataList,
      this.plutusScriptMap,
      this.nativeScriptList,
      this.mints
    );
    const scriptDataHash = generateScriptDataHash(
      this._protocolParams.languageView,
      encodedWitnesses,
      this._isPlutusV1Transaction,
      this._isPlutusV2Transaction,
      this._isPlutusV3Transaction
    );
    const encodedBody = this.transactionBody({ extraOutputs, scriptDataHash });
    const transaction = [
      encodedBody,
      encodedWitnesses,
      true,
      this.auxiliaryData ? encodeAuxiliaryData(this.auxiliaryData) : null,
    ];
    const cborTrx = cbors.Encoder.encode(transaction) as Buffer;
    return cborTrx.length;
  }

  calculateFee(extraOutputs?: Array<Output>): BigNumber {
    const txSize = this.calculateTxSize(extraOutputs);
    const txFee = this.transactionFee(txSize);
    const contractFee = this.contractFee();
    // introduced in Conway era
    const refScriptFee = this.calculateRefScriptFee();
    return txFee.plus(contractFee).plus(refScriptFee);
  }

  setFee(fee: BigNumber): void {
    this.fee = fee;
  }

  getFee(): BigNumber {
    return this.fee;
  }

  calculateMinUtxoAmountBabbage(output: Output): BigNumber {
    return calculateMinUtxoAmountBabbage(output, this._protocolParams.utxoCostPerByte);
  }

  addWitness(witness: VKeyWitness): void {
    this.witnesses.push(witness);
  }

  getTransactionHash(): Buffer {
    const encodedWitnesses = encodeWitnesses(
      this.witnesses,
      this.inputs,
      this.plutusDataList,
      this.plutusScriptMap,
      this.nativeScriptList,
      this.mints
    );
    const scriptDataHash = generateScriptDataHash(
      this._protocolParams.languageView,
      encodedWitnesses,
      this._isPlutusV1Transaction,
      this._isPlutusV2Transaction,
      this._isPlutusV3Transaction
    );
    const encodedBody = this.transactionBody({ scriptDataHash });
    const cborBody = cbors.Encoder.encode(encodedBody) as Buffer;
    return hash32(cborBody);
  }

  getAuxiliaryData(): AuxiliaryData | undefined {
    return this.auxiliaryData;
  }

  getAuxiliaryDataHashHex(): string | undefined {
    if (this.auxiliaryData) {
      const encodedAuxiliaryData = encodeAuxiliaryData(this.auxiliaryData);
      const auxiliaryDataCbor = cbors.Encoder.encode(encodedAuxiliaryData);
      return hash32(auxiliaryDataCbor).toString("hex");
    }
    return undefined;
  }

  buildTransaction(): { hash: string; payload: string } {
    const encodedWitnesses = encodeWitnesses(
      this.witnesses,
      this.inputs,
      this.plutusDataList,
      this.plutusScriptMap,
      this.nativeScriptList,
      this.mints
    );
    const scriptDataHash = generateScriptDataHash(
      this._protocolParams.languageView,
      encodedWitnesses,
      this._isPlutusV1Transaction,
      this._isPlutusV2Transaction,
      this._isPlutusV3Transaction
    );
    const encodedBody = this.transactionBody({ scriptDataHash });
    const transaction = [
      encodedBody,
      encodedWitnesses,
      true,
      this.auxiliaryData ? encodeAuxiliaryData(this.auxiliaryData) : null,
    ];
    const cborTrx = cbors.Encoder.encode(transaction) as Buffer;

    const trxBodyCbor = cbors.Encoder.encode(encodedBody);
    const hash = hash32(trxBodyCbor).toString("hex");

    return {
      hash,
      payload: cborTrx.toString("hex"),
    };
  }

  getInputs(): Array<Input> {
    return this.inputs;
  }

  getCertificates(): Array<Certificate> {
    return this.certificates;
  }

  getMints(): Array<Mint> {
    const tokens: Array<Token> = [];
    for (const mint of this.mints) {
      for (const asset of mint.assets) {
        tokens.push({
          policyId: mint.policyId,
          assetName: asset.assetName,
          amount: asset.amount,
        });
      }
    }
    const sortedTokens = sortTokens(tokens);
    return _(sortedTokens)
      .groupBy((token) => token.policyId)
      .map((tokens, policyId) => ({
        policyId,
        assets: tokens.map((t) => ({ assetName: t.assetName, amount: t.amount })),
      }))
      .value();
  }

  getMintTokens(): Array<Token> {
    const tokens = [];
    for (const mint of this.mints) {
      for (const asset of mint.assets) {
        if (asset.amount.isPositive()) {
          tokens.push({
            policyId: mint.policyId,
            assetName: asset.assetName,
            amount: asset.amount,
          });
        }
      }
    }
    return tokens;
  }

  getBurnTokens(): Array<Token> {
    const tokens = [];
    for (const mint of this.mints) {
      for (const asset of mint.assets) {
        if (asset.amount.isNegative()) {
          tokens.push({
            policyId: mint.policyId,
            assetName: asset.assetName,
            amount: asset.amount.abs(),
          });
        }
      }
    }
    return tokens;
  }

  getInputAmount(): { ada: BigNumber; tokens: Array<Token> } {
    let inputTokens: Array<Token> = [];
    let ada = new BigNumber(0);

    _.forEach(this.inputs, (input) => {
      inputTokens = inputTokens.concat(input.tokens);
      ada = ada.plus(input.amount);
    });

    inputTokens = _.concat(inputTokens, this.getMintTokens());

    return {
      ada,
      tokens: getUniqueTokens(inputTokens),
    };
  }

  getCollaterals(): Array<CollateralInput> {
    return this.collaterals;
  }

  getScriptIntegrityHash(): Buffer | undefined {
    const encodedWitnesses = encodeWitnesses(
      this.witnesses,
      this.inputs,
      this.plutusDataList,
      this.plutusScriptMap,
      this.nativeScriptList,
      this.mints
    );
    const scriptDataHash = generateScriptDataHash(
      this._protocolParams.languageView,
      encodedWitnesses,
      this._isPlutusV1Transaction,
      this._isPlutusV2Transaction,
      this._isPlutusV3Transaction
    );

    return scriptDataHash;
  }

  getCollateralAmount(): BigNumber {
    const ada = this.collaterals.reduce(
      (sum, collateral) => sum.plus(collateral.amount),
      new BigNumber(0)
    );
    return ada;
  }

  getOutputs(): Array<Output> {
    return this.outputs;
  }

  getOutputAmount(): { ada: BigNumber; tokens: Array<Token> } {
    let outputTokens: Array<Token> = [];
    let ada = new BigNumber(0);

    _.forEach(this.outputs, (output) => {
      outputTokens = outputTokens.concat(output.tokens);
      ada = ada.plus(output.amount);
    });

    outputTokens = _.concat(outputTokens, this.getBurnTokens());

    return {
      ada,
      tokens: getUniqueTokens(outputTokens),
    };
  }

  /**
   * This method scans the certificates and proposal procedures added in the transaction
   * to calculate additional ADA required for transaction validity.
   * 1. stake key registration deposit ADA
   * 2. proposal procedure deposit ADA
   * @returns additional ADA required for a valid transaction
   */
  getAdditionalOutputAda(): BigNumber {
    const depositInCerts = _.reduce(
      this.certificates,
      (result, cert) => {
        if (cert.type === CertificateType.STAKE_REGISTRATION) {
          // legacy stake registration cert, use deposit value from protocol param
          return result.plus(this._protocolParams.stakeKeyDeposit);
        }
        if (cert.type === CertificateType.STAKE_KEY_REGISTRATION) {
          return result.plus(cert.cert.deposit);
        }
        return result;
      },
      new BigNumber(0)
    );

    const depositInProposalProcedure = _.reduce(
      this.proposalProcedures,
      (result, pp) => {
        return result.plus(pp.deposit);
      },
      new BigNumber(0)
    );

    return depositInCerts.plus(depositInProposalProcedure);
  }

  /**
   * This method scans the certificates added in the transaction to calculate
   * additional ADA available in inputs as part of the deposit refund.
   * Essentially ADA to be considered as additional input deu to deposit refunds.
   * @returns additional ADA available as input
   */
  getAdditionalInputAda(): BigNumber {
    const certDeposit = _.reduce(
      this.certificates,
      (result, cert) => {
        if (cert.type === CertificateType.STAKE_DE_REGISTRATION) {
          // legacy stake de registration certificate, use deposit value from protocol params
          return result.plus(this._protocolParams.stakeKeyDeposit);
        }
        if (cert.type === CertificateType.STAKE_KEY_DE_REGISTRATION) {
          return result.plus(cert.cert.deposit);
        }
        return result;
      },
      new BigNumber(0)
    );

    const withdrawalAda = _.reduce(
      this.withdrawals,
      (result, withdrawal) => {
        return result.plus(withdrawal.amount);
      },
      new BigNumber(0)
    );

    return certDeposit.plus(withdrawalAda);
  }

  getWithdrawals(): Array<Withdrawal> {
    return this.withdrawals;
  }

  getRequiredWitnesses(): Map<string, BipPath | undefined> {
    return this.requiredWitnesses;
  }

  getRequiredNativeScriptWitnesses(): Map<string, undefined> {
    return this.requiredNativeScriptWitnesses;
  }

  getRequiredSigners(): Map<string, BipPath | undefined> {
    return this.requiredSigners;
  }

  getVotingProcedures(): Array<VotingProcedure> {
    return this.votingProcedures;
  }

  getProposalProcedures(): Array<ProposalProcedure> {
    return this.proposalProcedures;
  }

  setAuxiliaryData(auxData: AuxiliaryData): void {
    this.auxiliaryData = auxData;
  }

  isPlutusTransaction(): boolean {
    return (
      this._isPlutusV1Transaction || this._isPlutusV2Transaction || this._isPlutusV3Transaction
    );
  }

  /**
   * Function to prepare transaction automatically
   * There are other helper methods for preparing transactions that use this method
   * This method should be used when you know what you are doing
   * sets required inputs,
   * fees,
   * change etc
   * resulting transaction is the final tx that can be built for signing
   */
  prepareTransaction({
    inputs,
    changeAddress,
    collateralInputs = [],
  }: {
    inputs: Array<Input>;
    changeAddress: CardanoAddress;
    collateralInputs?: Array<CollateralInput>;
  }): Transaction {
    return transactionBuilder({ transaction: this, inputs, changeAddress, collateralInputs });
  }

  /**
   * Function for a simple send ADA transaction
   * Provide necessary outputs, and available inputs, returns a final tx
   */
  paymentTransaction({
    inputs,
    outputs,
    changeAddress,
    auxiliaryData,
    ttl,
  }: {
    inputs: Array<Input>;
    outputs: Array<Output>;
    changeAddress: CardanoAddress;
    auxiliaryData?: AuxiliaryData;
    ttl: number;
  }) {
    return paymentTransaction({
      inputs,
      outputs,
      changeAddress,
      auxiliaryData,
      ttl,
      protocolParams: this.protocolParams,
    });
  }
}

export default Transaction;
