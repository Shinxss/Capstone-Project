import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const TaskLedger = await ethers.getContractFactory("TaskLedger");
  const contract = await TaskLedger.deploy(deployer.address);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ TaskLedger deployed at:", address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});