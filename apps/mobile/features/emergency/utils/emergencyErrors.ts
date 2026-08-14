import { isAxiosError } from "axios";

export function getSosSubmissionErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "The request took too long. Check your connection and try again.";
    }
    if (!error.response) {
      return "Unable to connect to Lifeline. Check your internet connection and try again.";
    }

    const message = String(error.response.data?.message ?? error.response.data?.error ?? "").trim();
    if (error.response.status === 400 && message) return message;
    return "We couldn't send your SOS. Please try again.";
  }

  if (error instanceof Error && /location|permission/i.test(error.message)) {
    return error.message;
  }

  return "We couldn't send your SOS. Please try again.";
}
