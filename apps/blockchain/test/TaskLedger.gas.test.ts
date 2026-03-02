import { expect } from "chai";
import { ethers } from "hardhat";

describe("TaskLedger gas snapshots", function () {
  async function deployFixture() {
    const [admin, verifier] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TaskLedger");
    const ledger = await factory.deploy(admin.address);
    await ledger.waitForDeployment();
    await ledger.connect(admin).grantVerifier(verifier.address);
    return { ledger, verifier };
  }

  it("verifyTask estimateGas stays within budget", async function () {
    const { ledger, verifier } = await deployFixture();
    const taskIdHash = ethers.id("gas-task-1");
    const payloadHash = ethers.id("gas-payload-1");
    const gasEstimate = await ledger.connect(verifier).verifyTask.estimateGas(taskIdHash, payloadHash);
    const gasUsed = Number(gasEstimate);
    const gasBudget = Number(process.env.VERIFY_TASK_GAS_MAX || "80000");

    console.log(`[gas] verifyTask estimateGas=${gasUsed} budget=${gasBudget}`);
    expect(gasUsed).to.be.lessThanOrEqual(gasBudget);
  });
});
