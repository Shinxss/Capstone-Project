import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { DispatchProofAsset } from "./dispatchProofAsset.model";
import {
  dispatchProofAssetExists,
  readDispatchProofAsset,
  removeDispatchProofAsset,
  storeDispatchProofAsset,
} from "./dispatchProofAsset.service";

test("dispatch proofs remain readable when the local upload file is lost", async () => {
  const filename = `proof-storage-test_${Date.now()}.png`;
  const original = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);
  const localPath = path.join(process.cwd(), "uploads", "dispatch-proofs", filename);
  let durablePayload: Buffer | null = null;

  const originalFindOneAndUpdate = DispatchProofAsset.findOneAndUpdate;
  const originalFindOne = DispatchProofAsset.findOne;
  const originalDeleteOne = DispatchProofAsset.deleteOne;
  const originalExists = DispatchProofAsset.exists;

  (DispatchProofAsset as any).findOneAndUpdate = async (_filter: unknown, update: any) => {
    durablePayload = Buffer.from(update.$set.payload);
  };
  (DispatchProofAsset as any).findOne = () => ({
    select: () => ({
      lean: async () => ({ payload: durablePayload, mimeType: "image/png" }),
    }),
  });
  (DispatchProofAsset as any).deleteOne = async () => undefined;
  (DispatchProofAsset as any).exists = async () => (durablePayload ? { _id: "stored" } : null);

  try {
    await storeDispatchProofAsset({
      filename,
      dispatchId: "dispatch-test",
      mimeType: "image/png",
      buffer: original,
    });
    assert.ok(durablePayload);

    await fs.promises.unlink(localPath);
    assert.equal(
      await dispatchProofAssetExists(`/uploads/dispatch-proofs/${filename}`),
      true,
    );
    const recovered = await readDispatchProofAsset(filename);

    assert.equal(recovered?.mimeType, "image/png");
    assert.deepEqual(recovered?.buffer, original);
  } finally {
    await removeDispatchProofAsset(filename).catch(() => undefined);
    (DispatchProofAsset as any).findOneAndUpdate = originalFindOneAndUpdate;
    (DispatchProofAsset as any).findOne = originalFindOne;
    (DispatchProofAsset as any).deleteOne = originalDeleteOne;
    (DispatchProofAsset as any).exists = originalExists;
  }
});
