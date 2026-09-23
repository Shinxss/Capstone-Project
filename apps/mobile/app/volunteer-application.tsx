import React, { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { useVolunteerApplicationForm } from "../features/volunteer/hooks/useVolunteerApplicationForm";
import { VolunteerApplicationView } from "../features/volunteer/components/VolunteerApplicationView";
import { VolunteerApplicationSuccessModal } from "../features/volunteer/components/VolunteerApplicationSuccessModal";

export default function VolunteerApplicationScreen() {
  const {
    form,
    setForm,
    skillOptions,
    submitting,
    error,
    errors,
    submitAttempted,
    submit,
  } = useVolunteerApplicationForm();

  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const onBack = () => router.back();

  const onSubmit = async () => {
    const result = await submit();

    if (!result.ok) {
      if (result.reason === "validation") {
        Alert.alert("Check required fields", "Please fix the highlighted fields.");
        return;
      }
      if (result.reason === "busy") {
        return;
      }

      Alert.alert(
        "Submission failed",
        result.message || "Application could not be submitted. Please try again."
      );
      return;
    }

    setSuccessModalVisible(true);
  };

  const onViewStatus = () => {
    setSuccessModalVisible(false);
    router.replace("/(tabs)/more");
  };

  const onBackToProfile = () => {
    setSuccessModalVisible(false);
    router.replace("/(tabs)/more");
  };

  return (
    <>
      <VolunteerApplicationView
        form={form}
        setForm={setForm}
        skillOptions={skillOptions}
        submitting={submitting}
        error={error}
        errors={errors}
        showErrors={submitAttempted}
        submitDisabled={submitting}
        onBack={onBack}
        onSubmit={onSubmit}
      />

      <VolunteerApplicationSuccessModal
        visible={successModalVisible}
        onViewStatus={onViewStatus}
        onBackToProfile={onBackToProfile}
      />
    </>
  );
}
