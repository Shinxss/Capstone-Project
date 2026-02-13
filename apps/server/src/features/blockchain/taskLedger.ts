import { ethers } from "ethers";

export type ChainRecord = {
  network: string;
  contractAddress: string;
  txHash: string;
  blockNumber?: number;
  recordHash: string;
  recordedAt: Date;
};

const LEDGER_ABI = [
  "function recordTask(bytes32 recordHash, bytes32 dispatchIdHash, bytes32 emergencyIdHash, bytes32 volunteerIdHash) external",
  "function recorded(bytes32) view returns (bool)",
  "function owner() view returns (address)",
];

function mustEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Blockchain misconfigured: missing ${key}`);
  return v;
}

function resolveChainEnv() {
  const chainEnv = String(process.env.CHAIN_ENV || "ganache").toLowerCase();

  const rpcUrl = mustEnv(chainEnv === "ganache" ? "GANACHE_RPC_URL" : "SEPOLIA_RPC_URL");
  const privateKey = mustEnv(chainEnv === "ganache" ? "GANACHE_PRIVATE_KEY" : "SEPOLIA_PRIVATE_KEY");
  const rawContractAddress = mustEnv("TASK_LEDGER_CONTRACT_ADDRESS").trim();

  if (!ethers.isAddress(rawContractAddress)) {
    throw new Error(
      `Blockchain misconfigured: TASK_LEDGER_CONTRACT_ADDRESS must be a 20-byte hex address (got: ${rawContractAddress}).`
    );
  }

  const contractAddress = ethers.getAddress(rawContractAddress);
  return { chainEnv, rpcUrl, privateKey, contractAddress };
}

export function hashDispatchRecord(input: {
  dispatchId: string;
  emergencyId: string;
  volunteerId: string;
  completedAt?: Date | null;
  proofUrls?: string[];
}) {
  const payload = {
    dispatchId: String(input.dispatchId || ""),
    emergencyId: String(input.emergencyId || ""),
    volunteerId: String(input.volunteerId || ""),
    completedAt: input.completedAt ? new Date(input.completedAt).toISOString() : null,
    proofUrls: Array.isArray(input.proofUrls) ? [...input.proofUrls].sort() : [],
  };

  const json = JSON.stringify(payload);
  return ethers.keccak256(ethers.toUtf8Bytes(json));
}

export function hashId(id: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(String(id || "")));
}

export async function recordVerifiedDispatchOnChain(params: {
  dispatchId: string;
  emergencyId: string;
  volunteerId: string;
  completedAt?: Date | null;
  proofUrls?: string[];
}): Promise<ChainRecord> {
  const { chainEnv, rpcUrl, privateKey, contractAddress } = resolveChainEnv();

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const [code, signerBalance] = await Promise.all([
    provider.getCode(contractAddress),
    provider.getBalance(wallet.address),
  ]);

  if (code === "0x") {
    throw new Error(
      `Blockchain misconfigured: no contract deployed at ${contractAddress} on ${chainEnv}.`
    );
  }
  if (signerBalance === 0n) {
    throw new Error(`Blockchain signer has no funds: ${wallet.address}`);
  }

  const recordHash = hashDispatchRecord(params);
  const dispatchIdHash = hashId(params.dispatchId);
  const emergencyIdHash = hashId(params.emergencyId);
  const volunteerIdHash = hashId(params.volunteerId);

  const contract = new ethers.Contract(contractAddress, LEDGER_ABI, wallet);

  // If already recorded, return a synthetic record (idempotent behavior)
  try {
    const exists = await contract.recorded(recordHash);
    if (exists) {
      return {
        network: chainEnv,
        contractAddress,
        txHash: "already-recorded",
        recordHash,
        recordedAt: new Date(),
      };
    }
  } catch {
    // ignore read failures; we'll attempt to record
  }

  let tx;
  try {
    tx = await contract.recordTask(recordHash, dispatchIdHash, emergencyIdHash, volunteerIdHash);
  } catch (e: any) {
    const message = String(e?.shortMessage || e?.message || "Blockchain write failed");
    if (message.toLowerCase().includes("insufficient funds")) {
      throw new Error(`Blockchain signer has insufficient funds: ${wallet.address}`);
    }
    throw new Error(`Blockchain write failed: ${message}`);
  }

  const receipt = await tx.wait();

  return {
    network: chainEnv,
    contractAddress,
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber,
    recordHash,
    recordedAt: new Date(),
  };
}
