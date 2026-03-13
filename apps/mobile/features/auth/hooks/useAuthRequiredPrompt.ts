import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../AuthProvider";
import type { AuthBlockedAction, AuthRequiredModalProps } from "../../../components/AuthRequiredModal";

type AuthRequiredOpenOptions = {
  blockedAction?: AuthBlockedAction;
  title?: string;
  message?: string;
};

type AuthRequiredState = AuthRequiredOpenOptions & {
  visible: boolean;
};

const INITIAL_STATE: AuthRequiredState = {
  visible: false,
  blockedAction: undefined,
  title: undefined,
  message: undefined,
};

export function useAuthRequiredPrompt() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [state, setState] = useState<AuthRequiredState>(INITIAL_STATE);

  const closeAuthRequired = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const openAuthRequired = useCallback((options?: AuthRequiredOpenOptions) => {
    setState({
      visible: true,
      blockedAction: options?.blockedAction,
      title: options?.title,
      message: options?.message,
    });
  }, []);

  const navigateToAuth = useCallback(
    async (path: "/(auth)/login" | "/(auth)/signup") => {
      closeAuthRequired();

      try {
        await signOut();
      } catch {
        // Navigation should still proceed even if local session cleanup fails.
      }

      router.replace(path);
    },
    [closeAuthRequired, router, signOut]
  );

  const goToLogin = useCallback(async () => {
    await navigateToAuth("/(auth)/login");
  }, [navigateToAuth]);

  const goToSignup = useCallback(async () => {
    await navigateToAuth("/(auth)/signup");
  }, [navigateToAuth]);

  const requireAuth = useCallback(
    (isAuthed: boolean, options?: AuthRequiredOpenOptions) => {
      if (isAuthed) return true;
      openAuthRequired(options);
      return false;
    },
    [openAuthRequired]
  );

  const modalProps = useMemo<AuthRequiredModalProps>(
    () => ({
      visible: state.visible,
      blockedAction: state.blockedAction,
      title: state.title,
      message: state.message,
      onClose: closeAuthRequired,
      onSignIn: () => {
        void goToLogin();
      },
      onRegister: () => {
        void goToSignup();
      },
    }),
    [closeAuthRequired, goToLogin, goToSignup, state.blockedAction, state.message, state.title, state.visible]
  );

  return {
    openAuthRequired,
    closeAuthRequired,
    requireAuth,
    goToLogin,
    goToSignup,
    modalProps,
  };
}
