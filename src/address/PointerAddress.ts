/* eslint-disable no-bitwise */
import { Buffer } from "buffer";
import { HashType, Credential, NetworkId } from "../types";
import ShelleyTypeAddress from "./ShelleyTypeAddress";

export class PointerAddress extends ShelleyTypeAddress {
  protected _vlq;
  constructor(networkId: NetworkId, paymentCredential: Credential, vlq: string) {
    super(networkId, paymentCredential);
    this._vlq = vlq;
    this.computeHex();
  }

  protected computeHex(): void {
    let payload = 0b0100_0000;
    if (this._paymentCredential.type === HashType.ADDRESS) {
      // set 4th bit to 0, which is set by default
    } else if (this._paymentCredential.type === HashType.SCRIPT) {
      const mask = 1 << 4;
      payload |= mask;
    }
    payload |= this.networkId;
    const address = `${payload.toString(16).padStart(2, "0")}${this._paymentCredential.hash.toString("hex")}${
      this._vlq
    }`;
    this.addressHex = address;
    this.addressBytes = Buffer.from(address, "hex");
    this.addressBech32 = this.computeBech32(this.addressBytes);
  }
}

export default PointerAddress;
