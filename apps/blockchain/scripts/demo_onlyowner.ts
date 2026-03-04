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
  const strangerPk = mustEnv("STRANGER_PRIVATE_KEY");

  const admin = new ethers.Wallet(adminPk, ethers.provider);
  const stranger = new ethers.Wallet(strangerPk, ethers.provider);

  console.log("Contract:", contractAddress);
  console.log("Admin:", admin.address);
  console.log("Stranger:", stranger.address);

  const ledgerAdmin = await ethers.getContractAt("TaskLedger", contractAddress, admin);
  const ledgerStranger = await ethers.getContractAt("TaskLedger", contractAddress, stranger);

  // Sanity: admin has ADMIN_ROLE?
  const adminRole = await ledgerAdmin.ADMIN_ROLE();
  console.log("admin has ADMIN_ROLE?", await ledgerAdmin.hasRole(adminRole, admin.address));

  // 1) Admin call (SUCCESS)
  console.log("\n[1] Admin calls grantVerifier(stranger) => should succeed");
  try {
    const tx = await ledgerAdmin.grantVerifier(stranger.address);
    console.log("tx:", tx.hash);
    await tx.wait();
    console.log("✅ success");
  } catch (e: any) {
    await printRevert(ledgerAdmin, e);
  }

  // 2) Change user (Stranger tries admin-only) => UNAUTHORIZED
  console.log("\n[2] Stranger calls grantVerifier(...) => should revert unauthorized");
  try {
    const tx = await ledgerStranger.grantVerifier(stranger.address);
    console.log("tx:", tx.hash);
    await tx.wait();
    console.log("❌ unexpected success");
  } catch (e: any) {
    console.log("✅ blocked (expected)");
    await printRevert(ledgerStranger, e);
  }

  // 3) Change back to admin (SUCCESS again)
  console.log("\n[3] Admin calls grantVerifier(admin) => should succeed");
  try {
    const tx = await ledgerAdmin.grantVerifier(admin.address);
    console.log("tx:", tx.hash);
    await tx.wait();
    console.log("✅ success again");
  } catch (e: any) {
    await printRevert(ledgerAdmin, e);
  }

  console.log("\n✅ demo_onlyowner done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});