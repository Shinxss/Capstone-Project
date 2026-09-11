import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";
import SplashOne from "../../../assets/images/splashscreens/splash1.svg";
import SplashTwo from "../../../assets/images/splashscreens/splash2.svg";
import SplashThree from "../../../assets/images/splashscreens/splash3.svg";
import SplashFour from "../../../assets/images/splashscreens/splash4.svg";

export type OnboardingSlideData = {
  id: "response" | "report" | "responders" | "routes";
  Illustration: ComponentType<SvgProps>;
  illustrationLabel: string;
  title: string;
  description: string;
  buttonLabel: "Continue" | "Get Started";
};

export const ONBOARDING_COLORS = {
  background: "#FFFFFF",
  primary: "#E5242A",
  primaryPressed: "#C91F24",
  heading: "#1E2329",
  secondaryText: "#6B7280",
  mutedText: "#9CA3AF",
  inactivePagination: "#E5E7EB",
} as const;

export const ONBOARDING_SLIDES: readonly OnboardingSlideData[] = [
  {
    id: "response",
    Illustration: SplashOne,
    illustrationLabel: "Emergency responders helping a family",
    title: "Emergency Response.\nConnected.",
    description:
      "Help people get the right emergency response when every second matters.",
    buttonLabel: "Continue",
  },
  {
    id: "report",
    Illustration: SplashTwo,
    illustrationLabel: "A person reporting an emergency from a mobile phone",
    title: "Report Emergencies Quickly",
    description:
      "Send emergency reports with your location and important details in seconds.",
    buttonLabel: "Continue",
  },
  {
    id: "responders",
    Illustration: SplashThree,
    illustrationLabel: "An emergency request connecting with nearby responders",
    title: "Connect With Responders",
    description:
      "Nearby verified responders can receive and accept emergency requests fast.",
    buttonLabel: "Continue",
  },
  {
    id: "routes",
    Illustration: SplashFour,
    illustrationLabel: "An ambulance following a safer emergency route",
    title: "Find Safer Routes",
    description:
      "Lifeline helps responders navigate using emergency and hazard information.",
    buttonLabel: "Get Started",
  },
] as const;
