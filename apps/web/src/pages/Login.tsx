import { useLguLogin } from ".././features/auth/hooks/useLguLogin";
import LguLoginView from ".././features/auth/components/LguLoginView";

export default function Login() {
  const vm = useLguLogin();
  return <LguLoginView {...vm} />;
}
