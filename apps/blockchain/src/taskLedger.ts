import { Contract, JsonRpcProvider, Wallet, getAddress, id, isAddress, keccak256, toUtf8Bytes } from "ethers";
import TaskLedgerAbiJson from "./abi/TaskLedger.abi.json";
import { canonicalStringify } from "./hash";

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
};

export async function recordTaskVerification(input: RecordTaskVerificationInput): Promise<RecordTaskVerificationOutput> {
  const taskId = String(input.taskId || "");
  if (!taskId) throw new Error("recordTaskVerification: taskId is required");

  const taskIdHash = id(taskId);

  const payloadJson = canonicalStringify(input.payload);
  const payloadHash = keccak256(toUtf8Bytes(payloadJson));

  const contract = getTaskLedgerContract(input);
  let tx;
  try {
    tx = await contract.recordVerification(taskIdHash, payloadHash);
  } catch (e: any) {
    const decoded = tryDecodeRevert(e, contract);
    if (decoded) throw new Error(`recordTaskVerification: ${decoded}`);
    throw e;
  }

  const receipt = await tx.wait();

  const blockNumber = receipt?.blockNumber;
  if (typeof blockNumber !== "number") {
    throw new Error("recordTaskVerification: missing blockNumber in transaction receipt");
  }

  return { txHash: tx.hash, blockNumber, taskIdHash, payloadHash };
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

    if (parsed?.name) return `execution reverted (${parsed.name}).`;
  } catch {
    // ignore decode failures
  }

  const fallback = String(e?.shortMessage || e?.message || "").trim();
  return fallback ? fallback : null;
}
