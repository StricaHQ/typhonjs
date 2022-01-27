import { Buffer } from "buffer";
import * as cbors from "@stricahq/cbors";
import BigNumber from "bignumber.js";
import _ from "lodash";

import { generateScriptDataHash, getUniqueTokens, sortTokens } from "../utils/helpers";

import {
  CardanoAddress,
  CertificateType,
  CollateralInput,
  HashCredential,
  HashType,
  PlutusDataConstructor,
  ProtocolParams,
  TransactionBodyItemType,
} from "../types";
import type {
  BipPath,
  AuxiliaryData,
  Certificate,
  Input,
  Output,
  Withdrawal,
  Token,
  VKeyWitness,
} from "../types";
import {
  encodeAuxiliaryData,
  encodeCertificates,
  encodeCollaterals,
  encodeInputs,
  encodeOutputs,
  encodeWithdrawals,
  encodeWitnesses,
} from "../utils/encoder";
import { hash32 } from "../utils/crypto";
import { calculateMinUtxoAmount } from "../utils/utils";
import transactionBuilder from "./transactionBuilder";
import { paymentTransaction } from "./paymentTransaction";

export class Transaction {
  protected _protocolParams: ProtocolParams;

  protected inputs: Array<Input> = [];
  protected outputs: Array<Output> = [];
  protected certificates: Array<Certificate> = [];
  protected withdrawals: Array<Withdrawal> = [];
  protected requiredWitnesses: Map<string, BipPath | undefined> = new Map();
  protected fee: BigNumber = new BigNumber(5000000);
  protected ttl: number | undefined = undefined;
  protected witnesses: Array<VKeyWitness> = [];
  protected auxiliaryData: AuxiliaryData | undefined = undefined;
  protected collaterals: Array<CollateralInput> = [];
  protected requiredSigners: Map<string, BipPath | undefined> = new Map();
  protected plutusDataList: Array<PlutusDataConstructor> = [];
  protected _isPlutusTransaction = false;

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

  addInput(input: Input): void {
    if (input.address.paymentCredential.type === HashType.ADDRESS) {
      this.requiredWitnesses.set(
        input.address.paymentCredential.hash,
        input.address.paymentCredential.bipPath
      );
    } else if (input.redeemer) {
      this._isPlutusTransaction = true;
    }
    this.inputs.push(input);
  }

  addRequiredSigner(credential: HashCredential): void {
    if (!this.requiredWitnesses.get(credential.hash)) {
      this.requiredSigners.set(credential.hash, credential.bipPath);
      this.requiredWitnesses.set(credential.hash, credential.bipPath);
    }
  }

  addCollateral(input: CollateralInput): void {
    if (input.address.paymentCredential.type === HashType.ADDRESS) {
      this.requiredWitnesses.set(
        input.address.paymentCredential.hash,
        input.address.paymentCredential.bipPath
      );
    }
    this.collaterals.push(input);
  }

  addCertificate(certificate: Certificate): void {
    if (certificate.certType === CertificateType.STAKE_DELEGATION) {
      if (certificate.stakeCredential.type === HashType.ADDRESS) {
        this.requiredWitnesses.set(
          certificate.stakeCredential.hash,
          certificate.stakeCredential.bipPath
        );
      }
    } else if (certificate.certType === CertificateType.STAKE_DE_REGISTRATION) {
      if (certificate.stakeCredential.type === HashType.ADDRESS) {
        this.requiredWitnesses.set(
          certificate.stakeCredential.hash,
          certificate.stakeCredential.bipPath
        );
      }
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
        withdrawal.rewardAccount.stakeCredential.hash,
        withdrawal.rewardAccount.stakeCredential.bipPath
      );
    }
    this.withdrawals.push(withdrawal);
  }

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
    encodedBody.set(TransactionBodyItemType.TTL, this.ttl);
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

    const memPrice = new BigNumber(totalMem).times(this._protocolParams.priceMem);
    const stepsPrice = new BigNumber(totalSteps).times(this._protocolParams.priceSteps);
    return memPrice.plus(stepsPrice).integerValue(BigNumber.ROUND_CEIL);
  }

  calculateFee(extraOutputs?: Array<Output>): BigNumber {
    const dummyWitnesses: Array<VKeyWitness> = [];
    for (const [index] of Array.from(this.requiredWitnesses.keys()).entries()) {
      dummyWitnesses.push({
        publicKey: Buffer.alloc(32, index),
        signature: Buffer.alloc(64),
      });
    }
    const encodedWitnesses = encodeWitnesses(dummyWitnesses, this.inputs, this.plutusDataList);
    const scriptDataHash = generateScriptDataHash(
      encodedWitnesses,
      this._protocolParams.languageView
    );
    const encodedBody = this.transactionBody({ extraOutputs, scriptDataHash });
    const transaction = [
      encodedBody,
      encodedWitnesses,
      true,
      this.auxiliaryData ? encodeAuxiliaryData(this.auxiliaryData) : null,
    ];
    const cborTrx = cbors.Encoder.encode(transaction) as Buffer;

    const txFee = this.transactionFee(cborTrx.length);
    const contractFee = this.contractFee();
    return txFee.plus(contractFee);
  }

  setFee(fee: BigNumber): void {
    this.fee = fee;
  }

  getFee(): BigNumber {
    return this.fee;
  }

  calculateMinUtxoAmount(tokens: Array<Token>, hasPlutusDataHash?: boolean): BigNumber {
    return calculateMinUtxoAmount(
      tokens,
      this._protocolParams.lovelacePerUtxoWord,
      hasPlutusDataHash
    );
  }

  addWitness(witness: VKeyWitness): void {
    this.witnesses.push(witness);
  }

  getTransactionHash(): Buffer {
    const encodedWitnesses = encodeWitnesses(this.witnesses, this.inputs, this.plutusDataList);
    const scriptDataHash = generateScriptDataHash(
      encodedWitnesses,
      this._protocolParams.languageView
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
    const encodedWitnesses = encodeWitnesses(this.witnesses, this.inputs, this.plutusDataList);
    const scriptDataHash = generateScriptDataHash(
      encodedWitnesses,
      this._protocolParams.languageView
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

  getInputAmount(): { ada: BigNumber; tokens: Array<Token> } {
    let inputTokens: Array<Token> = [];
    let ada = new BigNumber(0);

    _.forEach(this.inputs, (input) => {
      inputTokens = inputTokens.concat(input.tokens);
      ada = ada.plus(input.amount);
    });

    return {
      ada,
      tokens: getUniqueTokens(inputTokens),
    };
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

    return {
      ada,
      tokens: getUniqueTokens(outputTokens),
    };
  }

  getAdditionalOutputAda(): BigNumber {
    return _.reduce(
      this.certificates,
      (result, cert) => {
        if (cert.certType === CertificateType.STAKE_REGISTRATION) {
          return result.plus(this._protocolParams.stakeKeyDeposit);
        }
        return result;
      },
      new BigNumber(0)
    );
  }

  getAdditionalInputAda(): BigNumber {
    const certDeposit = _.reduce(
      this.certificates,
      (result, cert) => {
        if (cert.certType === CertificateType.STAKE_DE_REGISTRATION) {
          return result.plus(this._protocolParams.stakeKeyDeposit);
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

  getRequiredSigners(): Map<string, BipPath | undefined> {
    return this.requiredSigners;
  }

  setAuxiliaryData(auxData: AuxiliaryData): void {
    this.auxiliaryData = auxData;
  }

  isPlutusTransaction(): boolean {
    return this._isPlutusTransaction;
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
