import BigNumber from "bignumber.js";
import _ = require("lodash");
import { CardanoAddress, Input, Output, CollateralInput } from "../../types";
import { getTokenDiff } from "../../utils/helpers";
import {
  calculateMinUtxoAmountBabbage,
  getAddressFromHex,
  getMaximumTokenSets,
} from "../../utils/utils";
import Transaction from "../Transaction";

export function transactionBuilder({
  transaction,
  inputs,
  changeAddress,
  collateralInputs = [],
}: {
  transaction: Transaction;
  inputs: Array<Input>;
  changeAddress: CardanoAddress;
  collateralInputs?: Array<CollateralInput>;
}): Transaction {
  const verifyCollateral = (currentFee: BigNumber) => {
    const currentCollateral = transaction.getCollateralAmount();
    const requiredCollateral = currentFee
      .times(transaction.protocolParams.collateralPercent)
      .div(100);
    const isPlutusTx = transaction.isPlutusTransaction();
    if (isPlutusTx && currentCollateral.lt(requiredCollateral)) {
      throw new Error(
        "Not enough collateral supplied, collaterals with tokens are not valid collaterals"
      );
    }
  };

  const addCollateral = (currentFee: BigNumber) => {
    if (collateralInputs && collateralInputs.length > 0) {
      const currentCollateral = transaction.getCollateralAmount();
      const requiredCollateral = currentFee
        .times(transaction.protocolParams.collateralPercent)
        .div(100);
      while (currentCollateral.lt(requiredCollateral) && collateralInputs.length > 0) {
        const col = collateralInputs.pop();
        if (col) {
          transaction.addCollateral(col);
          // the new Fee also affects collateral, but collateral utxo is in enough amount, that this race condition is unlikely to happen
        }
      }
    }
  };

  const minUtxo = calculateMinUtxoAmountBabbage(
    {
      address: getAddressFromHex(
        Buffer.from(
          "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          "hex"
        )
      ),
      amount: new BigNumber(45000000000000000),
      tokens: [],
    },
    new BigNumber(transaction.protocolParams.utxoCostPerByte)
  );

  const utxoInputs = _.cloneDeep(inputs);

  // Add Inputs
  // there needs to be min one input, add that first
  if (utxoInputs.length > 0) {
    const firstInput = utxoInputs.splice(0, 1)[0];
    transaction.addInput(firstInput);
  }

  // add first collateral, if collaterals are supplied
  const col = collateralInputs.pop();
  if (col) {
    transaction.addCollateral(col);
  }

  for (const utxo of utxoInputs) {
    // optimized utxo selection
    const { ada: totalInputAda, tokens: totalInputTokens } = transaction.getInputAmount();
    const { ada: totalOutputAda, tokens: totalOutputTokens } = transaction.getOutputAmount();
    const additionalOutput = transaction.getAdditionalOutputAda();
    const additionalInput = transaction.getAdditionalInputAda();

    let trxFeeWithoutChange = transaction.calculateFee();

    addCollateral(trxFeeWithoutChange);
    trxFeeWithoutChange = transaction.calculateFee();

    const currentInput = totalInputAda.plus(additionalInput);
    const requiredInput = totalOutputAda.plus(additionalOutput).plus(trxFeeWithoutChange);

    const tokenDiff = getTokenDiff(totalInputTokens, totalOutputTokens);

    if (tokenDiff.length === 0) {
      if (currentInput.eq(requiredInput)) {
        // we got enough input
        break;
      } else if (currentInput.gt(requiredInput)) {
        // input diff without fee
        const inputDiff = currentInput.minus(totalOutputAda.plus(additionalOutput));
        // not equal to, as there will be a fee above minUtxo
        if (inputDiff.gt(minUtxo)) {
          let feeWithChange = transaction.calculateFee([
            {
              address: changeAddress,
              amount: inputDiff,
              tokens: [],
            },
          ]);
          addCollateral(trxFeeWithoutChange);
          feeWithChange = transaction.calculateFee([
            {
              address: changeAddress,
              amount: inputDiff,
              tokens: [],
            },
          ]);
          if (inputDiff.gte(feeWithChange.plus(minUtxo))) {
            // we got enough input
            break;
          }
        }
      }
    } else if (!tokenDiff.some(({ amount }) => amount.lt(0))) {
      const tokensTokens = getMaximumTokenSets(tokenDiff, transaction.protocolParams.maxValueSize);
      const changeOutputs: Array<Output> = [];
      let inputDiff = currentInput.minus(totalOutputAda.plus(additionalOutput));
      let extraAdaRequired = new BigNumber(0);
      for (const [index, tokens] of tokensTokens.entries()) {
        const minUtxo = calculateMinUtxoAmountBabbage(
          {
            address: changeAddress,
            amount: new BigNumber(45000000000000000),
            tokens,
          },
          new BigNumber(transaction.protocolParams.utxoCostPerByte)
        );
        let outputAmount = minUtxo;
        if (index === tokensTokens.length - 1) {
          // last set, add full ada diff as output
          let feeWithChange = transaction.calculateFee([
            ...changeOutputs,
            {
              address: changeAddress,
              amount: inputDiff.lt(minUtxo) ? minUtxo : inputDiff,
              tokens: tokens,
            },
          ]);
          addCollateral(feeWithChange);
          feeWithChange = transaction.calculateFee([
            ...changeOutputs,
            {
              address: changeAddress,
              amount: inputDiff.lt(minUtxo) ? minUtxo : inputDiff,
              tokens: tokens,
            },
          ]);
          const minADA = minUtxo.plus(feeWithChange);
          if (inputDiff.gte(minADA)) {
            outputAmount = inputDiff;
          } else {
            extraAdaRequired = extraAdaRequired.plus(minADA.minus(inputDiff));
          }
        } else if (inputDiff.gte(minUtxo)) {
          inputDiff = inputDiff.minus(minUtxo);
        } else {
          extraAdaRequired = extraAdaRequired.plus(minUtxo.minus(inputDiff));
        }
        changeOutputs.push({
          address: changeAddress,
          amount: outputAmount,
          tokens: tokens,
        });
      }
      if (extraAdaRequired.eq(0)) {
        // we got enough input
        break;
      }
    }
    transaction.addInput(utxo);
  }

  // Set Change
  const { ada: totalInputAda, tokens: totalInputTokens } = transaction.getInputAmount();
  const { ada: totalOutputAda, tokens: totalOutputTokens } = transaction.getOutputAmount();
  const additionalOutput = transaction.getAdditionalOutputAda();
  const additionalInput = transaction.getAdditionalInputAda();
  const currentInput = totalInputAda.plus(additionalInput);
  const currentOutput = totalOutputAda.plus(additionalOutput);
  const tokenDiff = getTokenDiff(totalInputTokens, totalOutputTokens);

  if (tokenDiff.length === 0) {
    const feeWithoutChange = transaction.calculateFee();
    const outputWithFee = currentOutput.plus(feeWithoutChange);
    if (currentInput.eq(outputWithFee)) {
      // no change required
      transaction.setFee(feeWithoutChange);
      verifyCollateral(feeWithoutChange);
    } else if (currentInput.gt(outputWithFee)) {
      const changeADA = currentInput.minus(currentOutput);
      // not equal to, as there will be a a slightly higher fee with new change
      if (changeADA.gt(minUtxo.plus(feeWithoutChange))) {
        const feeWithChange = transaction.calculateFee([
          {
            address: changeAddress,
            amount: changeADA,
            tokens: [],
          },
        ]);
        verifyCollateral(feeWithChange);
        transaction.setFee(feeWithChange);
        transaction.addOutput({
          address: changeAddress,
          amount: changeADA.minus(feeWithChange),
          tokens: [],
        });
      } else {
        // not enough ADA for a change, set remaining ADA as fee
        transaction.setFee(changeADA);
      }
    } else {
      throw new Error("Not enough ADA");
    }
  } else if (!tokenDiff.some(({ amount }) => amount.lt(0))) {
    const tokensTokens = getMaximumTokenSets(
      _.clone(tokenDiff),
      transaction.protocolParams.maxValueSize
    );
    const changeOutputs: Array<Output> = [];
    {
      let changeADA = currentInput.minus(currentOutput);
      tokensTokens.forEach((tokens, index) => {
        const minUtxo = calculateMinUtxoAmountBabbage(
          { address: changeAddress, amount: new BigNumber(45000000000000000), tokens },
          new BigNumber(transaction.protocolParams.utxoCostPerByte)
        );
        let outputAmount = minUtxo;
        if (index === tokensTokens.length - 1) {
          // last set, add full ada diff as output
          const feeWithChange = transaction.calculateFee([
            ...changeOutputs,
            {
              address: changeAddress,
              amount: changeADA.lt(minUtxo) ? minUtxo : changeADA,
              tokens: tokens,
            },
          ]);
          const minADA = minUtxo.plus(feeWithChange);
          if (changeADA.gte(minADA)) {
            outputAmount = changeADA;
          } else {
            throw new Error("Not enough ADA");
          }
        } else if (changeADA.gte(minUtxo)) {
          changeADA = changeADA.minus(minUtxo);
        } else {
          throw new Error("Not enough ADA");
        }
        changeOutputs.push({
          address: changeAddress,
          amount: outputAmount,
          tokens: tokens,
        });
      });
    }
    const feeWithChange = transaction.calculateFee(changeOutputs);
    verifyCollateral(feeWithChange);
    transaction.setFee(feeWithChange);
    let changeADA = currentInput.minus(currentOutput).minus(feeWithChange);
    tokensTokens.forEach((tokens, index) => {
      const minUtxo = calculateMinUtxoAmountBabbage(
        { address: changeAddress, amount: new BigNumber(45000000000000000), tokens },
        new BigNumber(transaction.protocolParams.utxoCostPerByte)
      );
      let outputAmount = minUtxo;
      if (index === tokensTokens.length - 1) {
        // last set, add full ada diff as output
        outputAmount = changeADA;
      } else if (changeADA.gte(minUtxo)) {
        changeADA = changeADA.minus(minUtxo);
      }
      transaction.addOutput({
        address: changeAddress,
        amount: outputAmount,
        tokens: tokens,
      });
    });
  } else {
    throw new Error("Not enough tokens");
  }

  const txSize = transaction.calculateTxSize();

  if (transaction.protocolParams.maxTxSize && txSize > transaction.protocolParams.maxTxSize) {
    throw new Error("Tx size limit reached, try spending lesser ADA/Tokens");
  }
  return transaction;
}

export default transactionBuilder;
