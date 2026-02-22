

import { toast } from "sonner";

const TOAST_DURATION_MS = 5000;

export function toastSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: TOAST_DURATION_MS,
  });
}

export function toastError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: TOAST_DURATION_MS,
  });
}

export function toastInfo(message: string, description?: string) {
  toast(message, {
    description,
    duration: TOAST_DURATION_MS,
  });
}

export function toastWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: TOAST_DURATION_MS,
  });
}
