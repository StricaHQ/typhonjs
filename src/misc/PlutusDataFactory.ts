import { Buffer } from "buffer";
import * as cbors from "@stricahq/cbors";
import { PlutusData } from "../types";
import { hash32 } from "../utils/crypto";
import { encodePlutusData } from "../utils/encoder";

export class PlutusDataFactory {
  private plutusData: PlutusData;
  private _cbor: Buffer;
  private _plutusDataHash: Buffer;

  constructor(plutusData: PlutusData) {
    this.plutusData = plutusData;
    const encodedPlutusData = encodePlutusData(plutusData);
    this._cbor = cbors.Encoder.encode(encodedPlutusData);
    this._plutusDataHash = hash32(this._cbor);
  }

  cbor(): Buffer {
    return this._cbor;
  }

  plutusDataHash(): Buffer {
    return this._plutusDataHash;
  }

  json(): PlutusData {
    return this.plutusData;
  }
}

export default PlutusData;
