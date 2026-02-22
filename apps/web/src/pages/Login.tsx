import { useEffect } from "react";
import { useLguLogin } from ".././features/auth/hooks/useLguLogin";
import LguLoginView from ".././features/auth/components/LguLoginView";
import FeedbackDemo from "@/features/feedback/components/FeedbackDemo";
import { toastWarning } from "@/services/feedback/toast.service";

const SESSION_WARNING_KEY = "lifeline-login-warning";

export default function Login() {
  const vm = useLguLogin();

  useEffect(() => {
    const warning = sessionStorage.getItem(SESSION_WARNING_KEY);
    if (!warning) return;
    sessionStorage.removeItem(SESSION_WARNING_KEY);
    toastWarning(warning);
  }, []);

  return (
    <>
      <LguLoginView {...vm} />
      {import.meta.env.DEV ? <FeedbackDemo /> : null}
    </>
  );
}
