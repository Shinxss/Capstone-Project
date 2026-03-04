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
  const strangerPk = mustEnv("STRANGER_PRIVATE_KEY");

  const admin = new ethers.Wallet(adminPk, ethers.provider);
  const verifier = new ethers.Wallet(verifierPk, ethers.provider);
  const stranger = new ethers.Wallet(strangerPk, ethers.provider);

  console.log("Contract:", contractAddress);
  console.log("Admin:", admin.address);
  console.log("Verifier:", verifier.address);
  console.log("Stranger:", stranger.address);

  const ledgerAdmin = await ethers.getContractAt("TaskLedger", contractAddress, admin);
  const ledgerVerifier = await ethers.getContractAt("TaskLedger", contractAddress, verifier);
  const ledgerStranger = await ethers.getContractAt("TaskLedger", contractAddress, stranger);

  // ensure verifier role
  const verifierRole = await ledgerAdmin.VERIFIER_ROLE();
  if (!(await ledgerAdmin.hasRole(verifierRole, verifier.address))) {
    const tx = await ledgerAdmin.grantVerifier(verifier.address);
    await tx.wait();
  }

  // Attack 1: unauthorized verify
  console.log("\n[ATTACK 1] Stranger tries verifyTask => should revert (unauthorized)");
  try {
    const tx = await ledgerStranger.verifyTask(ethers.id("atk-unauth"), ethers.id("atk-payload"));
    console.log("tx:", tx.hash);
    await tx.wait();
    console.log("❌ unexpected success");
  } catch (e: any) {
    console.log("✅ blocked (expected)");
    await printRevert(ledgerStranger, e);
  }

  // Attack 2: replay
  console.log("\n[ATTACK 2] Replay verifyTask same taskIdHash twice => 2nd should ALREADY_VERIFIED");
  const fixedTaskIdHash = ethers.id("replay-task-fixed");
  const fixedPayloadHash = ethers.id("replay-payload-fixed");

  // first attempt (may already be verified from past demos)
  try {
    const tx1 = await ledgerVerifier.verifyTask(fixedTaskIdHash, fixedPayloadHash);
    console.log("first tx:", tx1.hash);
    await tx1.wait();
    console.log("✅ first verify success");
  } catch (e: any) {
    console.log("(first verify already done before / reverted)");
    await printRevert(ledgerVerifier, e);
  }

  // second attempt should revert
  try {
    const tx2 = await ledgerVerifier.verifyTask(fixedTaskIdHash, fixedPayloadHash);
    console.log("second tx:", tx2.hash);
    await tx2.wait();
    console.log("❌ unexpected success");
  } catch (e: any) {
    console.log("✅ replay blocked (expected)");
    await printRevert(ledgerVerifier, e);
  }

  console.log("\n✅ demo_attack done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});