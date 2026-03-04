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
  const admin = new ethers.Wallet(adminPk, ethers.provider);

  console.log("Contract:", contractAddress);
  console.log("Admin:", admin.address);

  const ledger = await ethers.getContractAt("TaskLedger", contractAddress, admin);

  const salt = Date.now().toString();
  const neverVerifiedTask = ethers.id("edge-never-verified-" + salt);

  console.log("\n[EDGE 1] revoke without verify => NOT_VERIFIED");
  try {
    const tx = await ledger.revokeTaskVerification(neverVerifiedTask, ethers.id("reason-" + salt));
    console.log("tx:", tx.hash);
    await tx.wait();
    console.log("❌ unexpected success");
  } catch (e: any) {
    console.log("✅ expected failure");
    await printRevert(ledger, e);
  }

  console.log("\n[EDGE 2] reverify without verify => NOT_VERIFIED");
  try {
    const tx = await ledger.reverifyTask(neverVerifiedTask, ethers.id("payload-" + salt));
    console.log("tx:", tx.hash);
    await tx.wait();
    console.log("❌ unexpected success");
  } catch (e: any) {
    console.log("✅ expected failure");
    await printRevert(ledger, e);
  }

  console.log("\n✅ demo_edge done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});