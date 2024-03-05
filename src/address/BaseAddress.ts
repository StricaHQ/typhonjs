/* eslint-disable no-bitwise */
import { Buffer } from "buffer";
import { HashType, Credential, NetworkId } from "../types";
import ShelleyTypeAddress from "./ShelleyTypeAddress";

export class BaseAddress extends ShelleyTypeAddress {
  stakeCredential: Credential;

  constructor(networkId: NetworkId, paymentCredential: Credential, stakeCredential: Credential) {
    super(networkId, paymentCredential);
    this.stakeCredential = stakeCredential;
    this.computeHex();
  }

  protected computeHex(): void {
    let payload = 0b0000_0000;
    if (this._paymentCredential.type === HashType.ADDRESS) {
      // set 4th bit to 0, which is set by default
    } else if (this._paymentCredential.type === HashType.SCRIPT) {
      const mask = 1 << 4;
      payload |= mask;
    }
    if (this.stakeCredential.type === HashType.ADDRESS) {
      // set 5th bit to 0, which is set by default
    } else if (this.stakeCredential.type === HashType.SCRIPT) {
      const mask = 1 << 5;
      payload |= mask;
    }
    payload |= this.networkId;
    const address = `${payload.toString(16).padStart(2, "0")}${this._paymentCredential.hash.toString("hex")}${this.stakeCredential.hash.toString(
      "hex"
    )}`;
    this.addressHex = address;
    this.addressBytes = Buffer.from(address, "hex");
    this.addressBech32 = this.computeBech32(this.addressBytes);
  }
}

export default BaseAddress;
