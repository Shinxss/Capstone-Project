import { Contract, JsonRpcProvider, Wallet, getAddress, isAddress } from "ethers";
import TaskLedgerAbiJson from "./abi/TaskLedger.abi.json";
import type { TaskLedgerConnection } from "./taskLedger.models";

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

export function decodeRevertReason(e: any, contract: Contract): string | null {
  const revertData =
    (typeof e?.data === "string" && e.data.startsWith("0x") ? e.data : null) ||
    (typeof e?.error?.data === "string" && e.error.data.startsWith("0x") ? e.error.data : null) ||
    null;
  if (!revertData) return null;

  try {
    const parsed = contract.interface.parseError(revertData);
    if (parsed?.name === "Error") {
      const reason = String((parsed as any).args?.[0] ?? "").trim();
      if (reason === "ALREADY_VERIFIED") return "task already verified (ALREADY_VERIFIED).";
      if (reason === "NOT_VERIFIED") return "task is not verified yet (NOT_VERIFIED).";
      if (reason) return `execution reverted (${reason}).`;
      return "execution reverted (Error).";
    }

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

export async function resolveSignerAddress(contract: Contract): Promise<string> {
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

export async function resolveBlockTimestamp(contract: Contract, blockNumber: number): Promise<number | null> {
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

export function normalizeHash(value: string) {
  return String(value || "").trim().toLowerCase();
}
