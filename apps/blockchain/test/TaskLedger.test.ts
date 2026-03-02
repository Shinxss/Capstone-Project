import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("TaskLedger", function () {
  async function deployFixture() {
    const [admin, verifier, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TaskLedger");
    const ledger = await factory.deploy(admin.address);
    await ledger.waitForDeployment();
    await ledger.connect(admin).grantVerifier(verifier.address);
    return { ledger, admin, verifier, stranger };
  }

  it("verifier can verify once; second verify reverts ALREADY_VERIFIED", async function () {
    const { ledger, verifier } = await deployFixture();
    const taskIdHash = ethers.id("task-1");
    const payloadHash = ethers.id("payload-1");

    await expect(ledger.connect(verifier).verifyTask(taskIdHash, payloadHash))
      .to.emit(ledger, "TaskVerified")
      .withArgs(taskIdHash, payloadHash, verifier.address, anyValue);

    expect(await ledger.verifiedPayloadByTask(taskIdHash)).to.equal(payloadHash);
    expect(await ledger.revokedTask(taskIdHash)).to.equal(false);

    await expect(ledger.connect(verifier).verifyTask(taskIdHash, payloadHash)).to.be.revertedWith("ALREADY_VERIFIED");
  });

  it("non-verifier cannot verify", async function () {
    const { ledger, stranger } = await deployFixture();
    const taskIdHash = ethers.id("task-2");
    const payloadHash = ethers.id("payload-2");

    await expect(ledger.connect(stranger).verifyTask(taskIdHash, payloadHash))
      .to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount")
      .withArgs(stranger.address, await ledger.VERIFIER_ROLE());
  });

  it("admin can revoke; non-admin cannot", async function () {
    const { ledger, admin, verifier, stranger } = await deployFixture();
    const taskIdHash = ethers.id("task-3");
    const payloadHash = ethers.id("payload-3");
    const reasonHash = ethers.id("reason-3");

    await ledger.connect(verifier).verifyTask(taskIdHash, payloadHash);

    await expect(ledger.connect(admin).revokeTaskVerification(taskIdHash, reasonHash))
      .to.emit(ledger, "TaskVerificationRevoked")
      .withArgs(taskIdHash, reasonHash, admin.address, anyValue);
    expect(await ledger.revokedTask(taskIdHash)).to.equal(true);

    await expect(ledger.connect(stranger).revokeTaskVerification(taskIdHash, reasonHash))
      .to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount")
      .withArgs(stranger.address, await ledger.ADMIN_ROLE());
  });

  it("admin can reverify and mapping is updated", async function () {
    const { ledger, admin, verifier } = await deployFixture();
    const taskIdHash = ethers.id("task-4");
    const oldPayloadHash = ethers.id("payload-old");
    const newPayloadHash = ethers.id("payload-new");

    await ledger.connect(verifier).verifyTask(taskIdHash, oldPayloadHash);
    await ledger.connect(admin).revokeTaskVerification(taskIdHash, ethers.id("reason-4"));

    await expect(ledger.connect(admin).reverifyTask(taskIdHash, newPayloadHash))
      .to.emit(ledger, "TaskReverified")
      .withArgs(taskIdHash, oldPayloadHash, newPayloadHash, admin.address, anyValue);

    expect(await ledger.verifiedPayloadByTask(taskIdHash)).to.equal(newPayloadHash);
    expect(await ledger.revokedTask(taskIdHash)).to.equal(false);
  });

  it("revokedTask defaults false after verify, true after revoke, false after reverify", async function () {
    const { ledger, admin, verifier } = await deployFixture();
    const taskIdHash = ethers.id("task-revoked-flow");
    const payloadHash = ethers.id("payload-revoked-flow");
    const newPayloadHash = ethers.id("payload-revoked-flow-new");
    const reasonHash = ethers.id("reason-revoked-flow");

    const verifyTx = await ledger.connect(verifier).verifyTask(taskIdHash, payloadHash);
    const verifyReceipt = await verifyTx.wait();
    console.log("[gas] verifyTask gasUsed =", verifyReceipt?.gasUsed?.toString());
    expect(await ledger.revokedTask(taskIdHash)).to.equal(false);

    await ledger.connect(admin).revokeTaskVerification(taskIdHash, reasonHash);
    expect(await ledger.revokedTask(taskIdHash)).to.equal(true);

    await ledger.connect(admin).reverifyTask(taskIdHash, newPayloadHash);
    expect(await ledger.revokedTask(taskIdHash)).to.equal(false);
  });
});
