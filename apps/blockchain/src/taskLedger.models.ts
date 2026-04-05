export type TaskLedgerConnection = {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
};

export type RecordTaskVerificationInput = TaskLedgerConnection & {
  taskId: string;
  payload: unknown;
};

export type RecordTaskVerificationOutput = {
  txHash: string;
  blockNumber: number;
  taskIdHash: string;
  payloadHash: string;
  signerAddress: string;
  blockTimestamp: number | null;
};

export type VerifyTaskInput = RecordTaskVerificationInput;
export type VerifyTaskOutput = RecordTaskVerificationOutput;

export type RevokeTaskVerificationInput = TaskLedgerConnection & {
  taskId: string;
  reason: unknown;
};

export type RevokeTaskVerificationOutput = {
  txHash: string;
  blockNumber: number;
  taskIdHash: string;
  reasonHash: string;
  signerAddress: string;
  blockTimestamp: number | null;
};

export type ReverifyTaskInput = TaskLedgerConnection & {
  taskId: string;
  payload: unknown;
};

export type ReverifyTaskOutput = {
  txHash: string;
  blockNumber: number;
  taskIdHash: string;
  payloadHash: string;
  signerAddress: string;
  blockTimestamp: number | null;
};

export type ReadTaskVerificationInput = TaskLedgerConnection & {
  taskId: string;
};

export type ReadTaskVerificationOutput = {
  taskIdHash: string;
  payloadHash: string;
  verified: boolean;
  revoked: boolean;
};
