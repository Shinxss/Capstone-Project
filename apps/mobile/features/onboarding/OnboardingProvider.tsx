import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
} from "./services/onboardingStorage";

type OnboardingContextValue = {
  hydrated: boolean;
  completed: boolean;
  completeOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;

    void getOnboardingCompleted()
      .then((value) => {
        if (mounted) setCompleted(value);
      })
      .catch(() => {
        if (mounted) setCompleted(false);
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await setOnboardingCompleted();
    setCompleted(true);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({ hydrated, completed, completeOnboarding }),
    [completeOnboarding, completed, hydrated]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return value;
}
