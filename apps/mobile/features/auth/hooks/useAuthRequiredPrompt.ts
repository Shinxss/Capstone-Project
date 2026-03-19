import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
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
  const { mode, signOut } = useAuth();
  const isFocused = useIsFocused();
  const [state, setState] = useState<AuthRequiredState>(INITIAL_STATE);

  useEffect(() => {
    if (mode === "authed") return;
    setState((prev) => (prev.visible ? INITIAL_STATE : prev));
  }, [mode]);

  useEffect(() => {
    if (isFocused) return;
    setState((prev) => (prev.visible ? INITIAL_STATE : prev));
  }, [isFocused]);

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
    (path: "/(auth)/login" | "/(auth)/signup") => {
      closeAuthRequired();
      void signOut().catch(() => undefined);
      router.replace(path);
    },
    [closeAuthRequired, router, signOut]
  );

  const goToLogin = useCallback(() => {
    navigateToAuth("/(auth)/login");
  }, [navigateToAuth]);

  const goToSignup = useCallback(() => {
    navigateToAuth("/(auth)/signup");
  }, [navigateToAuth]);

  const requireAuth = useCallback(
    (isAuthed: boolean, options?: AuthRequiredOpenOptions) => {
      if (isAuthed) return true;
      if (mode === "anonymous") {
        router.replace("/(auth)/login");
        return false;
      }
      openAuthRequired(options);
      return false;
    },
    [mode, openAuthRequired, router]
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
