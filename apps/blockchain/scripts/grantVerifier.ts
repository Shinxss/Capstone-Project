import { ethers } from "hardhat";

function mustEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

async function main() {
  const contractAddress = mustEnv("TASK_LEDGER_CONTRACT_ADDRESS").trim();
  const verifierAddress = mustEnv("VERIFIER_ADDRESS").trim();

  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`TASK_LEDGER_CONTRACT_ADDRESS is not a valid address: ${contractAddress}`);
  }
  if (!ethers.isAddress(verifierAddress)) {
    throw new Error(`VERIFIER_ADDRESS is not a valid address: ${verifierAddress}`);
  }

  const [admin] = await ethers.getSigners();

  console.log("Admin:", admin.address);
  console.log("Contract:", contractAddress);
  console.log("Verifier:", verifierAddress);

  const code = await ethers.provider.getCode(contractAddress);
  if (code === "0x") {
    throw new Error(`No contract deployed at ${contractAddress} on this network.`);
  }

  const ledger = await ethers.getContractAt("TaskLedger", contractAddress, admin);
  const verifierRole = await ledger.VERIFIER_ROLE();

  const already = await ledger.hasRole(verifierRole, verifierAddress);
  if (already) {
    console.log("Already has VERIFIER_ROLE.");
    return;
  }

  const tx = await ledger.grantVerifier(verifierAddress);
  console.log("txHash:", tx.hash);

  const receipt = await tx.wait();
  console.log("blockNumber:", receipt?.blockNumber);

  const nowHas = await ledger.hasRole(verifierRole, verifierAddress);
  console.log("hasRole:", nowHas);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

