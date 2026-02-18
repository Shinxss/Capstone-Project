import React from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { useVolunteerApplicationForm } from "../features/volunteer/hooks/useVolunteerApplicationForm";
import { VolunteerApplicationView } from "../features/volunteer/components/VolunteerApplicationView";

export default function VolunteerApplicationScreen() {
  const {
    form,
    setForm,
    submitting,
    error,
    errors,
    isValid,
    submitAttempted,
    submit,
  } = useVolunteerApplicationForm();

  const onBack = () => router.back();

  const onSubmit = async () => {
    const result = await submit();

    if (!result.ok) {
      if (result.reason === "validation") {
        Alert.alert("Check required fields", "Please fix the highlighted fields.");
        return;
      }

      Alert.alert("Submit failed", result.message ?? "Please try again.");
      return;
    }

    Alert.alert(
      "Submitted",
      "Application submitted! Status: Pending LGU Verification."
    );
    router.back();
  };

  return (
    <VolunteerApplicationView
      form={form}
      setForm={setForm}
      submitting={submitting}
      error={error}
      errors={errors}
      showErrors={submitAttempted}
      submitDisabled={submitting}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
}
