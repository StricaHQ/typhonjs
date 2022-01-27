/* eslint-disable no-bitwise */
import { Buffer } from "buffer";
import { bech32 } from "bech32";
import { HashType, Credential, NetworkId } from "../types";

export class RewardAddress {
  protected _stakeCredential: Credential;
  protected networkId: NetworkId;
  protected addressHex = "";
  protected addressBytes = Buffer.alloc(0);
  protected addressBech32 = "";

  constructor(networkId: NetworkId, stakeCredential: Credential) {
    this._stakeCredential = stakeCredential;
    this.networkId = networkId;
    this.computeHex();
  }

  protected computeBech32(address: Buffer): string {
    const data = this.networkId === NetworkId.MAINNET ? "stake" : "stake_test";
    const words = bech32.toWords(address);
    const encoded = bech32.encode(data, words, 1000);
    return encoded;
  }

  protected computeHex(): void {
    let payload = 0b1110_0000;
    if (this._stakeCredential.type === HashType.ADDRESS) {
      // set 4th bit to 0, which is set by default
    } else if (this._stakeCredential.type === HashType.SCRIPT) {
      const mask = 1 << 4;
      payload |= mask;
    }
    payload |= this.networkId;
    const address = `${payload.toString(16).padStart(2, "0")}${this._stakeCredential.hash}`;
    this.addressHex = address;
    this.addressBytes = Buffer.from(address, "hex");
    this.addressBech32 = this.computeBech32(this.addressBytes);
  }

  get stakeCredential() {
    return this._stakeCredential;
  }

  getHex(): string {
    return this.addressHex;
  }

  getBytes(): Buffer {
    return this.addressBytes;
  }

  getBech32(): string {
    return this.addressBech32;
  }

  getNetworkId(): NetworkId {
    return this.networkId;
  }
}

export default RewardAddress;
