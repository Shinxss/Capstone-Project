import "dotenv/config";
import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.TASK_LEDGER_CONTRACT_ADDRESS!;
  const verifier = process.env.VERIFIER_ADDRESS!;

  if (!contractAddress || !verifier) {
    throw new Error("Missing TASK_LEDGER_CONTRACT_ADDRESS or VERIFIER_ADDRESS in apps/blockchain/.env");
  }

  const [signer] = await ethers.getSigners(); // any signer is fine for READ calls
  console.log("Using signer:", signer.address);

  const ledger = await ethers.getContractAt("TaskLedger", contractAddress, signer);

  const role = await ledger.VERIFIER_ROLE();
  const ok = await ledger.hasRole(role, verifier);

  console.log("Contract:", contractAddress);
  console.log("Verifier:", verifier);
  console.log("VERIFIER_ROLE:", role);
  console.log("✅ hasRole(VERIFIER_ROLE, verifier) =", ok);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});