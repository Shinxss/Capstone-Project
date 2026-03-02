# Task Ledger v2 Migration Note

## Scope
This upgrade adds:
- on-chain duplicate protection (`verifiedPayloadByTask`)
- revoke/reverify flow
- off-chain payload versioning/domain fields
- proof file byte hashes (`proofFileHashes`)
- new Mongo `blockchain` verification state

## Existing verified records
Older records that only have `chainRecord` will continue to load.
The API now also writes a richer `blockchain` object for new verify/revoke/reverify actions.

Recommended one-time backfill for old verified docs:
1. For each dispatch with `chainRecord` and no `blockchain`, copy:
   - `blockchain.taskIdHash = chainRecord.taskIdHash`
   - `blockchain.payloadHash = chainRecord.payloadHash || chainRecord.recordHash`
   - `blockchain.verifiedTxHash = chainRecord.txHash`
   - `blockchain.verifiedAtBlockTime = chainRecord.recordedAt`
   - `blockchain.verifierAddress = ""` (unknown for old rows unless recovered from tx logs)
   - `blockchain.revoked = false`
   - `blockchain.schemaVersion = "1"`
   - `blockchain.domain = "LIFELINE_TASK_V1"`
   - `blockchain.network/contractAddress` from existing `chainRecord` if present
2. Keep `chainRecord` for compatibility with existing UI consumers.

## Existing proof uploads
Older proof entries may not have `fileHash`.
- New uploads now store `proofs[].fileHash` and normalized `proofFileHashes[]`.
- For old uploads, hashes can be backfilled only by reading stored files and hashing decrypted bytes.
- Until backfilled, payload building falls back to whatever hashes are already present.
