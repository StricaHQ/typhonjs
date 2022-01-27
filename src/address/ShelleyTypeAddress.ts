import { Buffer } from "buffer";
import { bech32 } from "bech32";
import { NetworkId, Credential } from "../types";

export abstract class ShelleyTypeAddress {
  protected _paymentCredential: Credential;
  protected networkId: NetworkId;
  protected addressHex = "";
  protected addressBytes = Buffer.alloc(0);
  protected addressBech32 = "";

  constructor(networkId: NetworkId, paymentCredential: Credential) {
    this.networkId = networkId;
    this._paymentCredential = paymentCredential;
  }

  protected abstract computeHex(): void;

  protected computeBech32(address: Buffer): string {
    const data = this.networkId === NetworkId.MAINNET ? "addr" : "addr_test";
    const words = bech32.toWords(address);
    const encoded = bech32.encode(data, words, 1000);
    return encoded;
  }

  get paymentCredential() {
    return this._paymentCredential;
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

export default ShelleyTypeAddress;
