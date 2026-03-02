import "dotenv/config";
import { ethers } from "hardhat";

function mustEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v.trim();
}

async function main() {
  const contractAddress = mustEnv("TASK_LEDGER_CONTRACT_ADDRESS");
  const callerPk = mustEnv("CALLER_PRIVATE_KEY");

  const caller = new ethers.Wallet(callerPk, ethers.provider);
  console.log("Caller (msg.sender):", caller.address);

  const ledger = await ethers.getContractAt("TaskLedger", contractAddress, caller);

  // 1) prove role
  const role = await ledger.VERIFIER_ROLE();
  const hasRole = await ledger.hasRole(role, caller.address);
  console.log("has VERIFIER_ROLE?", hasRole);

  // 2) use unique hashes every run (NORMAL case)
  const salt = Date.now().toString();
  const taskIdHash = ethers.id("task-" + salt);
  const payloadHash = ethers.id("payload-" + salt);

  // 3) prove it’s not already verified
  const existing = await ledger.verifiedPayloadByTask(taskIdHash);
  console.log("existing payloadHash:", existing);

  try {
    const tx = await ledger.verifyTask(taskIdHash, payloadHash);
    console.log("txHash:", tx.hash);
    await tx.wait();
    console.log("✅ SUCCESS");
  } catch (e: any) {
    console.log("❌ REVERT shortMessage:", e.shortMessage ?? e.message);

    // Try to decode revert reason/custom error
    const data = e.data ?? e.error?.data;
    if (data) {
      try {
        const parsed = ledger.interface.parseError(data);
        if (parsed) {
          console.log("Decoded error:", parsed.name, parsed.args);
        } else {
          console.log("Decoded error: unknown");
        }
      } catch {
        // For custom errors (e.g., AlreadyVerified/NotVerified), ethers often surfaces details in shortMessage.
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
