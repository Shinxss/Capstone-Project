import "dotenv/config";
import { ethers } from "hardhat";

function mustEnv(k: string) {
  const v = process.env[k]?.trim();
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
}

async function printRevert(ledger: any, e: any) {
  console.log("❌ REVERT:", e.shortMessage ?? e.message);
  const data = e.data ?? e.error?.data;
  if (data) {
    try {
      const parsed = ledger.interface.parseError(data);
      console.log("Decoded:", parsed.name, parsed.args);
    } catch {}
  }
}

async function main() {
  const contractAddress = mustEnv("TASK_LEDGER_CONTRACT_ADDRESS");
  const adminPk = mustEnv("DEPLOYER_PRIVATE_KEY");
  const verifierPk = mustEnv("VERIFIER_PRIVATE_KEY");

  const admin = new ethers.Wallet(adminPk, ethers.provider);
  const verifier = new ethers.Wallet(verifierPk, ethers.provider);

  console.log("Contract:", contractAddress);
  console.log("Admin:", admin.address);
  console.log("Verifier:", verifier.address);

  const ledgerAdmin = await ethers.getContractAt("TaskLedger", contractAddress, admin);
  const ledgerVerifier = await ethers.getContractAt("TaskLedger", contractAddress, verifier);

  // Ensure verifier role
  const verifierRole = await ledgerAdmin.VERIFIER_ROLE();
  const has = await ledgerAdmin.hasRole(verifierRole, verifier.address);
  console.log("verifier has VERIFIER_ROLE?", has);

  if (!has) {
    console.log("Granting verifier role...");
    const tx = await ledgerAdmin.grantVerifier(verifier.address);
    console.log("grant tx:", tx.hash);
    await tx.wait();
    console.log("✅ granted");
  }

  // Verify fresh task
  const salt = Date.now().toString();
  const taskIdHash = ethers.id("task-normal-" + salt);
  const payloadHash = ethers.id("payload-normal-" + salt);

  console.log("\n[VERIFY] verifier.verifyTask(...) => should succeed");
  try {
    const tx = await ledgerVerifier.verifyTask(taskIdHash, payloadHash);
    console.log("tx:", tx.hash);
    const receipt = await tx.wait();
    console.log("gasUsed:", receipt?.gasUsed.toString());
  } catch (e: any) {
    await printRevert(ledgerVerifier, e);
    return;
  }

  console.log("on-chain payload:", await ledgerVerifier.verifiedPayloadByTask(taskIdHash));
  console.log("revoked?", await ledgerVerifier.revokedTask(taskIdHash));
  console.log("\n✅ demo_normal done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});