// Replicant OCC detects divergence by hashing values
// This runs on every write on both sides, so the hash is fast and non-cryptographic

import type { Schema } from "effect";
import stringify from "fast-json-stable-stringify";
import murmur from "murmurhash3js-revisited";

declare const TextEncoder: {
	new (): { encode(input: string): Uint8Array };
};
const encoder = new TextEncoder();

export const stableStringify = (value: Schema.Json) => stringify(value);

const jsonToBytes = (value: Schema.Json) =>
	encoder.encode(stableStringify(value));

export const computeTestHash = (value: Schema.Json) =>
	murmur.x64.hash128(jsonToBytes(value));

export const computeFingerprint = (value: Schema.Json) =>
	murmur.x86.hash32(jsonToBytes(value));
