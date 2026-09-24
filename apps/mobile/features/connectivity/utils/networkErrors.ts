export function getHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const anyErr = error as any;
  const status = anyErr?.response?.status ?? anyErr?.status;
  return typeof status === "number" && Number.isFinite(status) ? status : null;
}

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const anyErr = error as any;

  if (anyErr.isAxiosError) {
    if (!anyErr.response) return true;
    if (anyErr.code === "ERR_NETWORK") return true;
    if (anyErr.code === "ECONNABORTED") return true;
  }

  const code = String(anyErr.code ?? "").toUpperCase();
  if (code === "ERR_NETWORK" || code === "ECONNABORTED" || code === "ETIMEDOUT" || code === "ENOTFOUND") {
    return true;
  }

  const message = String(anyErr.message ?? "").toLowerCase();
  if (
    message.includes("network error") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("internet connection") ||
    message.includes("connection refused")
  ) {
    return true;
  }

  return false;
}

export function isServerUnavailable(error: unknown): boolean {
  const status = getHttpStatus(error);
  return typeof status === "number" && status >= 500 && status < 600;
}

export function isOfflineOrServerUnavailable(error: unknown): boolean {
  return isNetworkError(error) || isServerUnavailable(error);
}

export function isAuthFailure(error: unknown): boolean {
  const status = getHttpStatus(error);
  return status === 401 || status === 403;
}

export function isValidationError(error: unknown): boolean {
  const status = getHttpStatus(error);
  return status === 400 || status === 422;
}
