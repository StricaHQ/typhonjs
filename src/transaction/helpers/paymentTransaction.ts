import Transaction from "../Transaction";
import { CardanoAddress, Output, Input, ProtocolParams, AuxiliaryData } from "../../types";

export const paymentTransaction = ({
  inputs,
  outputs,
  changeAddress,
  auxiliaryData,
  ttl,
  protocolParams,
}: {
  inputs: Array<Input>;
  outputs: Array<Output>;
  changeAddress: CardanoAddress;
  auxiliaryData?: AuxiliaryData;
  ttl: number;
  protocolParams: ProtocolParams;
}): Transaction => {
  const transaction = new Transaction({ protocolParams });

  // Add Outputs
  outputs.forEach((output) => {
    transaction.addOutput(output);
  });

  transaction.setTTL(ttl);

  if (auxiliaryData) {
    transaction.setAuxiliaryData(auxiliaryData);
  }

  return transaction.prepareTransaction({ inputs, changeAddress });
};

export default paymentTransaction;
