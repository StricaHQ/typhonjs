import { Buffer } from "buffer";
import { blake2b } from "blakejs";

export const hash32 = (data: Buffer): Buffer => {
  const hash = blake2b(data, undefined, 32);
  return Buffer.from(hash);
};

export const hash28 = (data: Buffer): Buffer => {
  const hash = blake2b(data, undefined, 28);
  return Buffer.from(hash);
};
