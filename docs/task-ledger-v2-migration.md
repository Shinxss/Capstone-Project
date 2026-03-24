# Task Ledger v2 Migration Note

This note covers compatibility and migration for dispatch blockchain records.

Last updated: 2026-03-24

## 1) What changed in v2

New dispatch verification behavior includes:

- duplicate-proof protection at contract level
- revoke and reverify transaction flows
- payload normalization fields (`schemaVersion`, `domain`)
- normalized proof hash array (`proofFileHashes`)
- richer Mongo verification object (`dispatch.blockchain`)

Current implementation is in:

- `apps/server/src/features/blockchain/taskLedger.ts`
- `apps/server/src/features/dispatches/dispatch.service.ts`

## 2) Backward compatibility

- Legacy records with only `chainRecord` are still supported.
- New verify/revoke/reverify writes populate `blockchain`.
- Keeping `chainRecord` is recommended while old clients still read it.

## 3) Suggested one-time backfill

Target rows:

- `dispatchoffers` documents where `chainRecord` exists and `blockchain` is missing.

Suggested mapping:

1. `blockchain.taskIdHash = chainRecord.taskIdHash`
2. `blockchain.payloadHash = chainRecord.payloadHash || chainRecord.recordHash`
3. `blockchain.verifiedTxHash = chainRecord.txHash`
4. `blockchain.verifiedAtBlockTime = chainRecord.recordedAt`
5. `blockchain.network = chainRecord.network`
6. `blockchain.contractAddress = chainRecord.contractAddress`
7. `blockchain.revoked = Boolean(chainRecord.revoked)`
8. `blockchain.schemaVersion` and `blockchain.domain`
   - use current constants from server blockchain layer
9. Leave `blockchain.verifierAddress` empty if historical tx sender is not recovered.

## 4) Proof hash migration

Older proofs may not contain `proofs[].fileHash`.

For historical backfill:

1. Read each stored proof file.
2. Decrypt payload bytes when encrypted.
3. Hash bytes (sha256) and store as `0x...` string.
4. Update:
   - `proofs[n].fileHash`
   - `proofFileHashes` (deduped, sorted)

Until backfilled, reverify uses available proof data and may produce weaker historical payload fidelity.

## 5) Validation checklist after migration

1. Sample migrated dispatch has both `chainRecord` and `blockchain`.
2. `status=VERIFIED` rows include `blockchain.taskIdHash` and `blockchain.payloadHash`.
3. New verify/revoke/reverify endpoints succeed:
   - `POST /api/dispatches/:id/verify`
   - `POST /api/dispatches/:id/revoke`
   - `POST /api/dispatches/:id/reverify`
4. UI pages reading verification history still render old and new records.

## 6) Rollback approach

If migration introduces issues:

- keep original `chainRecord` unchanged
- unset only newly added `blockchain` fields on affected records
- fix mapping script and rerun on a controlled subset first
