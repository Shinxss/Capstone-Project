import assert from "node:assert/strict";
import test from "node:test";
import { canonicalHash, TASK_PAYLOAD_DOMAIN, TASK_PAYLOAD_SCHEMA_VERSION } from "@lifeline/blockchain";
import { buildVerificationPayloadFromOffer, hashProofFileBytes } from "./dispatch.service";

test("canonical payload hashing is stable and includes schema/domain", () => {
  const hashA = hashProofFileBytes(Buffer.from("proof-a"));
  const hashB = hashProofFileBytes(Buffer.from("proof-b"));

  const offerA = {
    _id: "d1",
    emergencyId: "e1",
    volunteerId: "v1",
    completedAt: new Date("2026-02-01T00:00:00.000Z"),
    proofs: [
      { url: "/uploads/dispatch-proofs/b.jpg", fileHash: hashB },
      { url: "/uploads/dispatch-proofs/a.jpg", fileHash: hashA },
    ],
  };
  const offerB = {
    ...offerA,
    proofs: [...offerA.proofs].reverse(),
  };

  const payloadA = buildVerificationPayloadFromOffer(offerA);
  const payloadB = buildVerificationPayloadFromOffer(offerB);

  assert.equal(payloadA.schemaVersion, TASK_PAYLOAD_SCHEMA_VERSION);
  assert.equal(payloadA.domain, TASK_PAYLOAD_DOMAIN);
  assert.deepEqual(payloadA, payloadB);
  assert.equal(canonicalHash(payloadA), canonicalHash(payloadB));
});

test("proof file hashing uses sha256 bytes digest", () => {
  const actual = hashProofFileBytes(Buffer.from("hello"));
  const expected = "0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
  assert.equal(actual, expected);
});

test("payload prefers stored proofFileHashes from DB and keeps deterministic order", () => {
  const fromDbA = hashProofFileBytes(Buffer.from("db-a"));
  const fromDbB = hashProofFileBytes(Buffer.from("db-b"));

  const offer = {
    _id: "d2",
    emergencyId: "e2",
    volunteerId: "v2",
    completedAt: null,
    proofs: [{ url: "/uploads/dispatch-proofs/legacy.jpg" }],
    proofFileHashes: [fromDbB, fromDbA, fromDbA],
  };

  const payload = buildVerificationPayloadFromOffer(offer);
  assert.deepEqual(payload.proofFileHashes, [fromDbA, fromDbB].sort());
  assert.equal(canonicalHash(payload), canonicalHash(buildVerificationPayloadFromOffer(offer)));
});
