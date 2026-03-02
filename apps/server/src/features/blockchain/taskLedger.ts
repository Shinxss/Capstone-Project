import {
  TASK_PAYLOAD_DOMAIN,
  TASK_PAYLOAD_SCHEMA_VERSION,
  reverifyTaskOnChain,
  revokeTaskVerificationOnChain,
  verifyTaskOnChain,
} from "@lifeline/blockchain";

export const DISPATCH_CHAIN_SCHEMA_VERSION = TASK_PAYLOAD_SCHEMA_VERSION;
export const DISPATCH_CHAIN_DOMAIN = TASK_PAYLOAD_DOMAIN;

export type DispatchVerificationPayload = {
  schemaVersion: string;
  domain: string;
  taskId: string;
  dispatchId: string;
  emergencyId: string;
  volunteerId: string;
  completedAt: string | null;
  proofUrls: string[];
  proofFileHashes: string[];
};

export type BuildDispatchVerificationPayloadInput = {
  taskId: string;
  dispatchId: string;
  emergencyId: string;
  volunteerId: string;
  completedAt: string | null;
  proofUrls: string[];
  proofFileHashes: string[];
  schemaVersion?: string;
  domain?: string;
};

export function buildDispatchVerificationPayload(
  input: BuildDispatchVerificationPayloadInput
): DispatchVerificationPayload {
  return {
    schemaVersion: normalizeText(input.schemaVersion) || DISPATCH_CHAIN_SCHEMA_VERSION,
    domain: normalizeText(input.domain) || DISPATCH_CHAIN_DOMAIN,
    taskId: normalizeRequired(input.taskId, "taskId"),
    dispatchId: normalizeRequired(input.dispatchId, "dispatchId"),
    emergencyId: normalizeRequired(input.emergencyId, "emergencyId"),
    volunteerId: normalizeRequired(input.volunteerId, "volunteerId"),
    completedAt: input.completedAt,
    proofUrls: normalizeStringArray(input.proofUrls),
    proofFileHashes: normalizeStringArray(input.proofFileHashes),
  };
}

export type VerifyDispatchTaskOnChainInput = {
  taskId: string;
  payload: DispatchVerificationPayload;
};

export async function verifyDispatchTaskOnChain(input: VerifyDispatchTaskOnChainInput) {
  const connection = getTaskLedgerConnection();
  const chain = await verifyTaskOnChain({
    ...connection,
    taskId: normalizeRequired(input.taskId, "taskId"),
    payload: input.payload,
  });
  return {
    ...chain,
    network: getTaskLedgerNetwork(),
    contractAddress: connection.contractAddress,
  };
}

export type RevokeDispatchTaskOnChainInput = {
  taskId: string;
  reason: string;
};

export async function revokeDispatchTaskOnChain(input: RevokeDispatchTaskOnChainInput) {
  const connection = getTaskLedgerConnection();
  const taskId = normalizeRequired(input.taskId, "taskId");
  const reason = normalizeRequired(input.reason, "reason");
  const reasonPayload = {
    schemaVersion: DISPATCH_CHAIN_SCHEMA_VERSION,
    domain: DISPATCH_CHAIN_DOMAIN,
    taskId,
    reason,
  };
  const chain = await revokeTaskVerificationOnChain({
    ...connection,
    taskId,
    reason: reasonPayload,
  });
  return {
    ...chain,
    reasonPayload,
    network: getTaskLedgerNetwork(),
    contractAddress: connection.contractAddress,
  };
}

export type ReverifyDispatchTaskOnChainInput = {
  taskId: string;
  payload: DispatchVerificationPayload;
};

export async function reverifyDispatchTaskOnChain(input: ReverifyDispatchTaskOnChainInput) {
  const connection = getTaskLedgerConnection();
  const chain = await reverifyTaskOnChain({
    ...connection,
    taskId: normalizeRequired(input.taskId, "taskId"),
    payload: input.payload,
  });
  return {
    ...chain,
    network: getTaskLedgerNetwork(),
    contractAddress: connection.contractAddress,
  };
}

export function normalizeStringArray(values: string[]): string[] {
  const set = new Set<string>();
  for (const value of values ?? []) {
    const normalized = normalizeText(value);
    if (normalized) set.add(normalized);
  }
  return Array.from(set).sort();
}

function getTaskLedgerConnection() {
  const rpcUrl = mustEnv("SEPOLIA_RPC_URL");
  const privateKey = mustEnv("SEPOLIA_PRIVATE_KEY");
  const contractAddress = mustEnv("TASK_LEDGER_CONTRACT_ADDRESS").trim();
  return { rpcUrl, privateKey, contractAddress };
}

function getTaskLedgerNetwork() {
  return normalizeText(process.env.TASK_LEDGER_NETWORK) || "sepolia";
}

function normalizeRequired(value: string, field: string) {
  const normalized = normalizeText(value);
  if (!normalized) throw new Error(`Missing ${field}`);
  return normalized;
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function mustEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}
