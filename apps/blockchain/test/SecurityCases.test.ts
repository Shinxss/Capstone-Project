import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("Security Test Cases (Normal / HK / Attack)", function () {
  async function deployFixture() {
    const [admin, verifier, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TaskLedger");
    const ledger = await factory.deploy(admin.address);
    await ledger.waitForDeployment();
    await ledger.connect(admin).grantVerifier(verifier.address);
    return { ledger, admin, verifier, stranger };
  }

  describe("NORMAL (Legit behavior)", function () {
    it("Verifier can verifyTask (event emitted + mapping saved)", async function () {
      const { ledger, verifier } = await deployFixture();
      const taskIdHash = ethers.id("task-normal-1");
      const payloadHash = ethers.id("payload-normal-1");

      await expect(ledger.connect(verifier).verifyTask(taskIdHash, payloadHash))
        .to.emit(ledger, "TaskVerified")
        .withArgs(taskIdHash, payloadHash, verifier.address, anyValue);

      expect(await ledger.verifiedPayloadByTask(taskIdHash)).to.equal(payloadHash);
      expect(await ledger.revokedTask(taskIdHash)).to.equal(false);
    });

    it("Admin can revoke then reverify (audit correction flow)", async function () {
      const { ledger, admin, verifier } = await deployFixture();
      const taskIdHash = ethers.id("task-normal-2");
      const oldPayload = ethers.id("payload-old");
      const newPayload = ethers.id("payload-new");
      const reasonHash = ethers.id("reason-normal-2");

      await ledger.connect(verifier).verifyTask(taskIdHash, oldPayload);

      await expect(ledger.connect(admin).revokeTaskVerification(taskIdHash, reasonHash))
        .to.emit(ledger, "TaskVerificationRevoked")
        .withArgs(taskIdHash, reasonHash, admin.address, anyValue);

      await expect(ledger.connect(admin).reverifyTask(taskIdHash, newPayload))
        .to.emit(ledger, "TaskReverified")
        .withArgs(taskIdHash, oldPayload, newPayload, admin.address, anyValue);

      expect(await ledger.verifiedPayloadByTask(taskIdHash)).to.equal(newPayload);
      expect(await ledger.revokedTask(taskIdHash)).to.equal(false);
    });
  });

  describe("HK (Unauthorized user)", function () {
    it("Stranger cannot verifyTask (missing VERIFIER_ROLE)", async function () {
      const { ledger, stranger } = await deployFixture();
      await expect(
        ledger.connect(stranger).verifyTask(ethers.id("task-hk-1"), ethers.id("payload-hk-1"))
      )
        .to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, await ledger.VERIFIER_ROLE());
    });

    it("Stranger cannot revoke or reverify (missing ADMIN_ROLE)", async function () {
      const { ledger, stranger } = await deployFixture();

      await expect(
        ledger.connect(stranger).revokeTaskVerification(ethers.id("task-hk-2"), ethers.id("reason-hk-2"))
      )
        .to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, await ledger.ADMIN_ROLE());

      await expect(
        ledger.connect(stranger).reverifyTask(ethers.id("task-hk-2"), ethers.id("payload-hk-2"))
      )
        .to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, await ledger.ADMIN_ROLE());
    });

    it("Stranger cannot grantVerifier (admin-only)", async function () {
      const { ledger, stranger } = await deployFixture();
      await expect(ledger.connect(stranger).grantVerifier(stranger.address))
        .to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, await ledger.ADMIN_ROLE());
    });
  });

  describe("ATTACK (Exploit-style attempts)", function () {
    it("Replay/Duplicate verification is blocked (ALREADY_VERIFIED)", async function () {
      const { ledger, verifier } = await deployFixture();
      const taskIdHash = ethers.id("task-attack-1");
      const payloadHash = ethers.id("payload-attack-1");

      await ledger.connect(verifier).verifyTask(taskIdHash, payloadHash);

      // attacker (or even verifier) tries to replay same task verification
      await expect(ledger.connect(verifier).verifyTask(taskIdHash, payloadHash))
        .to.be.revertedWith("ALREADY_VERIFIED");
    });

    it("Cannot revoke/reverify a task that was never verified (NOT_VERIFIED)", async function () {
      const { ledger, admin } = await deployFixture();
      const taskIdHash = ethers.id("task-attack-2");

      await expect(
        ledger.connect(admin).revokeTaskVerification(taskIdHash, ethers.id("reason-attack-2"))
      ).to.be.revertedWith("NOT_VERIFIED");

      await expect(
        ledger.connect(admin).reverifyTask(taskIdHash, ethers.id("payload-attack-2"))
      ).to.be.revertedWith("NOT_VERIFIED");
    });
  });
});
