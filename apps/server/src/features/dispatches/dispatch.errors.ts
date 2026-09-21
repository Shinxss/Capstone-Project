export type DispatchErrorCode =
  | "RESPONDER_ALREADY_DISPATCHED"
  | "DISPATCH_OFFER_EXPIRED"
  | "DISPATCH_OFFER_NOT_PENDING";

export class DispatchConflictError extends Error {
  readonly statusCode = 409;

  constructor(
    message: string,
    readonly code: DispatchErrorCode,
  ) {
    super(message);
    this.name = "DispatchConflictError";
  }
}

export function isDispatchConflictError(error: unknown): error is DispatchConflictError {
  return error instanceof DispatchConflictError;
}
