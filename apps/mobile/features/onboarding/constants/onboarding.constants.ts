import type { ComponentType } from "react";
import {
  Bell,
  Heart,
  HeartHandshake,
  MapPinned,
  Route,
  ShieldCheck,
  Siren,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import type { SvgProps } from "react-native-svg";
import SplashOne from "../../../assets/images/splashscreens/splash1.svg";
import SplashTwo from "../../../assets/images/splashscreens/splash2.svg";
import SplashThree from "../../../assets/images/splashscreens/splash3.svg";
import SplashFour from "../../../assets/images/splashscreens/splash4.svg";

export type OnboardingFeatureData = {
  Icon: LucideIcon;
  title: string;
  description: string;
};

export type OnboardingSlideData = {
  id: "response" | "report" | "responders" | "routes";
  Illustration: ComponentType<SvgProps>;
  illustrationLabel: string;
  title: string;
  description: string;
  features: readonly OnboardingFeatureData[];
  buttonLabel: "Continue" | "Get Started";
};

export const ONBOARDING_COLORS = {
  background: "#FFFFFF",
  primary: "#EF2B3A",
  primaryPressed: "#D82030",
  heading: "#111827",
  secondaryText: "#6B7280",
  mutedText: "#9CA3AF",
  inactivePagination: "#E5E7EB",
  featureIconBackground: "#FDEDEE",
} as const;

export const ONBOARDING_SLIDES: readonly OnboardingSlideData[] = [
  {
    id: "response",
    Illustration: SplashOne,
    illustrationLabel: "Emergency responders helping a family",
    title: "Emergency Response. Connected.",
    description:
      "Help people get the right emergency response when every second matters.",
    features: [
      {
        Icon: HeartHandshake,
        title: "Faster Help",
        description: "Get the right help when it matters.",
      },
      {
        Icon: ShieldCheck,
        title: "Stronger Communities",
        description: "Connect people in times of need.",
      },
      {
        Icon: Heart,
        title: "A Safer Tomorrow",
        description: "Together, we save lives.",
      },
    ],
    buttonLabel: "Continue",
  },
  {
    id: "report",
    Illustration: SplashTwo,
    illustrationLabel: "A person reporting an emergency from a mobile phone",
    title: "Report Emergencies Quickly",
    description:
      "Send emergency reports with your location and important details in seconds.",
    features: [
      {
        Icon: Bell,
        title: "Instant Reports",
        description: "Report incidents in seconds.",
      },
      {
        Icon: MapPinned,
        title: "Accurate Location",
        description: "Share where help is needed.",
      },
      {
        Icon: TriangleAlert,
        title: "Real Impact",
        description: "Every report can save lives.",
      },
    ],
    buttonLabel: "Continue",
  },
  {
    id: "responders",
    Illustration: SplashThree,
    illustrationLabel: "An emergency request connecting with nearby responders",
    title: "Connect With Responders",
    description:
      "Nearby verified responders can receive and accept emergency requests fast.",
    features: [
      {
        Icon: Users,
        title: "Verified Responders",
        description: "Trusted people ready to help.",
      },
      {
        Icon: Siren,
        title: "Faster Response",
        description: "Nearby teams get alerted quickly.",
      },
      {
        Icon: HeartHandshake,
        title: "Stronger Together",
        description: "Communities respond as one.",
      },
    ],
    buttonLabel: "Continue",
  },
  {
    id: "routes",
    Illustration: SplashFour,
    illustrationLabel: "An ambulance following a safer emergency route",
    title: "Find Safer Routes",
    description:
      "Lifeline helps responders navigate using emergency and hazard information.",
    features: [
      {
        Icon: TriangleAlert,
        title: "Real-Time Hazards",
        description: "See road closures and risks ahead.",
      },
      {
        Icon: Route,
        title: "Smarter Navigation",
        description: "Find safer routes to emergencies.",
      },
      {
        Icon: ShieldCheck,
        title: "Stronger Outcomes",
        description: "Reach more people, faster.",
      },
    ],
    buttonLabel: "Get Started",
  },
] as const;
