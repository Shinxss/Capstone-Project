import { Contract, JsonRpcProvider, Wallet, getAddress, id, isAddress } from "ethers";
import TaskLedgerAbiJson from "./abi/TaskLedger.abi.json";
import { canonicalHash } from "./hash";

export type TaskLedgerConnection = {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
};

export function getTaskLedgerContract(params: TaskLedgerConnection): Contract {
  const rpcUrl = String(params.rpcUrl || "").trim();
  const privateKey = String(params.privateKey || "").trim();
  const contractAddressRaw = String(params.contractAddress || "").trim();

  if (!rpcUrl) throw new Error("getTaskLedgerContract: rpcUrl is required");
  if (!privateKey) throw new Error("getTaskLedgerContract: privateKey is required");
  if (!isAddress(contractAddressRaw)) {
    throw new Error(`getTaskLedgerContract: contractAddress is invalid (${contractAddressRaw})`);
  }

  const contractAddress = getAddress(contractAddressRaw);
  const abi = (TaskLedgerAbiJson as any)?.abi;
  if (!Array.isArray(abi)) {
    throw new Error("getTaskLedgerContract: ABI json is invalid (expected { abi: [...] })");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  return new Contract(contractAddress, abi, wallet);
}

export type RecordTaskVerificationInput = TaskLedgerConnection & {
  taskId: string;
  payload: unknown;
};

export type RecordTaskVerificationOutput = {
  txHash: string;
  blockNumber: number;
  taskIdHash: string;
  payloadHash: string;
  signerAddress: string;
  blockTimestamp: number | null;
};

export async function recordTaskVerification(input: RecordTaskVerificationInput): Promise<RecordTaskVerificationOutput> {
  return verifyTaskOnChain(input);
}

export type VerifyTaskInput = RecordTaskVerificationInput;
export type VerifyTaskOutput = RecordTaskVerificationOutput;

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
    const decoded = tryDecodeRevert(e, contract);
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

export type RevokeTaskVerificationInput = TaskLedgerConnection & {
  taskId: string;
  reason: unknown;
};

export type RevokeTaskVerificationOutput = {
  txHash: string;
  blockNumber: number;
  taskIdHash: string;
  reasonHash: string;
  signerAddress: string;
  blockTimestamp: number | null;
};

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
    const decoded = tryDecodeRevert(e, contract);
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

export type ReverifyTaskInput = TaskLedgerConnection & {
  taskId: string;
  payload: unknown;
};

export type ReverifyTaskOutput = {
  txHash: string;
  blockNumber: number;
  taskIdHash: string;
  payloadHash: string;
  signerAddress: string;
  blockTimestamp: number | null;
};

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
    const decoded = tryDecodeRevert(e, contract);
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

function tryDecodeRevert(e: any, contract: Contract): string | null {
  const revertData =
    (typeof e?.data === "string" && e.data.startsWith("0x") ? e.data : null) ||
    (typeof e?.error?.data === "string" && e.error.data.startsWith("0x") ? e.error.data : null) ||
    null;
  if (!revertData) return null;

  try {
    const parsed = contract.interface.parseError(revertData);
    if (parsed?.name === "AccessControlUnauthorizedAccount") {
      const account = String((parsed as any).args?.[0] ?? "");
      const neededRole = String((parsed as any).args?.[1] ?? "");
      if (account && neededRole) {
        return `unauthorized signer ${account} (missing role ${neededRole}). Have the contract admin call grantVerifier(${account}) on ${contract.target}.`;
      }
      return "unauthorized signer (missing required AccessControl role).";
    }

    if (parsed?.name === "AlreadyVerified") {
      return "task already verified (AlreadyVerified).";
    }
    if (parsed?.name === "NotVerified") {
      return "task is not verified yet (NotVerified).";
    }
    if (parsed?.name) return `execution reverted (${parsed.name}).`;
  } catch {
    // ignore decode failures
  }

  const fallback = String(e?.shortMessage || e?.message || "").trim();
  if (fallback.includes("ALREADY_VERIFIED")) return "task already verified (ALREADY_VERIFIED).";
  if (fallback.includes("NOT_VERIFIED")) return "task is not verified yet (NOT_VERIFIED).";
  if (fallback.includes("AlreadyVerified")) return "task already verified (AlreadyVerified).";
  if (fallback.includes("NotVerified")) return "task is not verified yet (NotVerified).";
  if (fallback.includes("missing role")) return fallback;
  return fallback ? fallback : null;
}

async function resolveSignerAddress(contract: Contract): Promise<string> {
  const maybeRunner = contract.runner as any;
  if (maybeRunner && typeof maybeRunner.getAddress === "function") {
    try {
      const address = await maybeRunner.getAddress();
      return String(address || "");
    } catch {
      return "";
    }
  }
  return "";
}

async function resolveBlockTimestamp(contract: Contract, blockNumber: number): Promise<number | null> {
  const maybeRunner = contract.runner as any;
  const provider = maybeRunner?.provider;
  if (!provider || typeof provider.getBlock !== "function") return null;
  try {
    const block = await provider.getBlock(blockNumber);
    return typeof block?.timestamp === "number" ? block.timestamp : null;
  } catch {
    return null;
  }
}
