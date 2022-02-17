import { Buffer } from "buffer";
import * as cbors from "@stricahq/cbors";
import { NativeScript } from "../types";
import { hash28 } from "../utils/crypto";
import { encodeNativeScript } from "../utils/encoder";

export class NativeScriptFactory {
  private nativeScript: NativeScript;
  private _cbor: Buffer;
  private _policyId: Buffer;

  constructor(nativeScript: NativeScript) {
    this.nativeScript = nativeScript;
    const encodedNativeScript = encodeNativeScript(nativeScript);
    this._cbor = cbors.Encoder.encode(encodedNativeScript);
    this._policyId = hash28(Buffer.from(`00${this._cbor.toString("hex")}`, "hex"));
  }

  cbor(): Buffer {
    return this._cbor;
  }

  policyId(): Buffer {
    return this._policyId;
  }

  json(): NativeScript {
    return this.nativeScript;
  }
}

export default NativeScriptFactory;
