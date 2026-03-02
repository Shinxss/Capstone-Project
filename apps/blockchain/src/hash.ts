import { keccak256, toUtf8Bytes } from "ethers";

export const TASK_PAYLOAD_SCHEMA_VERSION = "1";
export const TASK_PAYLOAD_DOMAIN = "LIFELINE_TASK_V1";

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function canonicalHash(value: unknown): string {
  return keccak256(toUtf8Bytes(canonicalStringify(value)));
}

function canonicalize(value: unknown): unknown {
  if (value === null) return null;

  if (typeof value === "string" || typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("canonicalStringify: non-finite numbers are not supported");
    }
    return value;
  }

  if (typeof value === "bigint") return value.toString();

  // Mirror JSON.stringify behavior for unsupported primitives.
  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol") return undefined;

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((v) => {
      const cv = canonicalize(v);
      return cv === undefined ? null : cv;
    });
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      const cv = canonicalize(obj[k]);
      // Mirror JSON.stringify behavior: omit keys with undefined/function/symbol values.
      if (cv !== undefined) out[k] = cv;
    }
    return out;
  }

  throw new Error("canonicalStringify: unsupported value");
}
