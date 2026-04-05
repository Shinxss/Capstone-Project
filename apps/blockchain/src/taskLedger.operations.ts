import { ZeroHash, id } from "ethers";
import { canonicalHash } from "./hash";
import {
  decodeRevertReason,
  getTaskLedgerContract,
  normalizeHash,
  resolveBlockTimestamp,
  resolveSignerAddress,
} from "./taskLedger.client";
import type {
  ReadTaskVerificationInput,
  ReadTaskVerificationOutput,
  RecordTaskVerificationInput,
  RecordTaskVerificationOutput,
  ReverifyTaskInput,
  ReverifyTaskOutput,
  RevokeTaskVerificationInput,
  RevokeTaskVerificationOutput,
  VerifyTaskInput,
  VerifyTaskOutput,
} from "./taskLedger.models";

export async function recordTaskVerification(
  input: RecordTaskVerificationInput
): Promise<RecordTaskVerificationOutput> {
  return verifyTaskOnChain(input);
}

export async function verifyTaskOnChain(input: VerifyTaskInput): Promise<VerifyTaskOutput> {
  const taskId = String(input.taskId || "");
  if (!taskId) throw new Error("verifyTaskOnChain: taskId is required");

  const taskIdHash = id(taskId);
  const payloadHash = canonicalHash(input.payload);

  const contract = getTaskLedgerContract(input);
  const signerAddress = await resolveSignerAddress(contract);

  let tx;
  try {
    tx = await contract.verifyTask(taskIdHash, payloadHash);
  } catch (e: any) {
    const decoded = decodeRevertReason(e, contract);
    if (decoded) throw new Error(`verifyTaskOnChain: ${decoded}`);
    throw e;
  }

  const receipt = await tx.wait();
  const blockNumber = receipt?.blockNumber;
  if (typeof blockNumber !== "number") {
    throw new Error("verifyTaskOnChain: missing blockNumber in transaction receipt");
  }

  const blockTimestamp = await resolveBlockTimestamp(contract, blockNumber);
  return { txHash: tx.hash, blockNumber, taskIdHash, payloadHash, signerAddress, blockTimestamp };
}

export async function revokeTaskVerificationOnChain(
  input: RevokeTaskVerificationInput
): Promise<RevokeTaskVerificationOutput> {
  const taskId = String(input.taskId || "");
  if (!taskId) throw new Error("revokeTaskVerificationOnChain: taskId is required");

  const taskIdHash = id(taskId);
  const reasonHash = canonicalHash(input.reason);

  const contract = getTaskLedgerContract(input);
  const signerAddress = await resolveSignerAddress(contract);

  let tx;
  try {
    tx = await contract.revokeTaskVerification(taskIdHash, reasonHash);
  } catch (e: any) {
    const decoded = decodeRevertReason(e, contract);
    if (decoded) throw new Error(`revokeTaskVerificationOnChain: ${decoded}`);
    throw e;
  }

  const receipt = await tx.wait();
  const blockNumber = receipt?.blockNumber;
  if (typeof blockNumber !== "number") {
    throw new Error("revokeTaskVerificationOnChain: missing blockNumber in transaction receipt");
  }

  const blockTimestamp = await resolveBlockTimestamp(contract, blockNumber);
  return { txHash: tx.hash, blockNumber, taskIdHash, reasonHash, signerAddress, blockTimestamp };
}

export async function reverifyTaskOnChain(input: ReverifyTaskInput): Promise<ReverifyTaskOutput> {
  const taskId = String(input.taskId || "");
  if (!taskId) throw new Error("reverifyTaskOnChain: taskId is required");

  const taskIdHash = id(taskId);
  const payloadHash = canonicalHash(input.payload);

  const contract = getTaskLedgerContract(input);
  const signerAddress = await resolveSignerAddress(contract);

  let tx;
  try {
    tx = await contract.reverifyTask(taskIdHash, payloadHash);
  } catch (e: any) {
    const decoded = decodeRevertReason(e, contract);
    if (decoded) throw new Error(`reverifyTaskOnChain: ${decoded}`);
    throw e;
  }

  const receipt = await tx.wait();
  const blockNumber = receipt?.blockNumber;
  if (typeof blockNumber !== "number") {
    throw new Error("reverifyTaskOnChain: missing blockNumber in transaction receipt");
  }

  const blockTimestamp = await resolveBlockTimestamp(contract, blockNumber);
  return { txHash: tx.hash, blockNumber, taskIdHash, payloadHash, signerAddress, blockTimestamp };
}

export async function readTaskVerificationOnChain(
  input: ReadTaskVerificationInput
): Promise<ReadTaskVerificationOutput> {
  const taskId = String(input.taskId || "");
  if (!taskId) throw new Error("readTaskVerificationOnChain: taskId is required");

  const taskIdHash = id(taskId);
  const contract = getTaskLedgerContract(input);

  const [payloadHashRaw, revokedRaw] = await Promise.all([
    contract.verifiedPayloadByTask(taskIdHash),
    contract.revokedTask(taskIdHash),
  ]);

  const payloadHash = String(payloadHashRaw || "");
  const verified = normalizeHash(payloadHash) !== normalizeHash(ZeroHash);
  const revoked = Boolean(revokedRaw);

  return { taskIdHash, payloadHash, verified, revoked };
}

export function hashTaskId(taskId: string): string {
  const normalizedTaskId = String(taskId || "");
  if (!normalizedTaskId) throw new Error("hashTaskId: taskId is required");
  return id(normalizedTaskId);
}

export function hashTaskPayload(payload: unknown): string {
  return canonicalHash(payload);
}

export function hashTaskRevokeReason(reason: unknown): string {
  return canonicalHash(reason);
}
