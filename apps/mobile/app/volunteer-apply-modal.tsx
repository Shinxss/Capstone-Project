import React from "react";
import { router } from "expo-router";
import { VolunteerApplyModalView } from "../features/volunteer/components/VolunteerApplyModalView";

export default function VolunteerApplyModalScreen() {
  const onClose = () => router.back();

  const onContinue = () => {
    router.back(); // close modal first
    router.push("/volunteer-application");
  };

  return <VolunteerApplyModalView onClose={onClose} onContinue={onContinue} />;
}
