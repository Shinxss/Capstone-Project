import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const { mode } = useAuth();
  const isFocused = useIsFocused();
  const [state, setState] = useState<AuthRequiredState>(INITIAL_STATE);
  const navigatingToAuthRef = useRef(false);

  useEffect(() => {
    if (mode === "authed") return;
    setState((prev) => (prev.visible ? INITIAL_STATE : prev));
  }, [mode]);

  useEffect(() => {
    if (isFocused) {
      navigatingToAuthRef.current = false;
      return;
    }
    setState((prev) => (prev.visible ? INITIAL_STATE : prev));
  }, [isFocused]);

  const closeAuthRequired = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const navigateToAuth = useCallback(
    (path: "/(auth)/login" | "/(auth)/signup") => {
      if (navigatingToAuthRef.current) return;

      closeAuthRequired();
      if (mode === "authed") return;

      navigatingToAuthRef.current = true;
      router.replace(path);
    },
    [closeAuthRequired, mode, router]
  );

  const openAuthRequired = useCallback(
    (options?: AuthRequiredOpenOptions) => {
      if (mode === "anonymous") {
        navigateToAuth("/(auth)/login");
        return;
      }

      setState({
        visible: true,
        blockedAction: options?.blockedAction,
        title: options?.title,
        message: options?.message,
      });
    },
    [mode, navigateToAuth]
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
        navigateToAuth("/(auth)/login");
        return false;
      }
      openAuthRequired(options);
      return false;
    },
    [mode, navigateToAuth, openAuthRequired]
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
