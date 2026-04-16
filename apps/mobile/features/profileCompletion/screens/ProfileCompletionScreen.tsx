import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import GradientScreen from "../../../src/components/GradientScreen";
import ProfileCompletionForm from "../components/ProfileCompletionForm";
import { useProfileCompletion } from "../hooks/useProfileCompletion";

export default function ProfileCompletionScreen() {
  const vm = useProfileCompletion();

  return (
    <GradientScreen gradientHeight={250}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerBlock}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>Enter the missing information before using Lifeline.</Text>
              <Text style={styles.helperText}>This only takes a minute.</Text>
            </View>

            <ProfileCompletionForm
              values={vm.values}
              errors={vm.errors}
              showFirstName={vm.showFirstName}
              showLastName={vm.showLastName}
              addressDisplay={vm.addressDisplay}
              serverError={vm.serverError}
              submitting={vm.submitting}
              canSubmit={vm.canSubmit}
              onChangeField={vm.setFieldValue}
              onSubmit={() => {
                void vm.submit();
              }}
              onLogout={() => {
                void vm.logout();
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 30,
  },
  headerBlock: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    color: "#111827",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  helperText: {
    marginTop: 12,
    color: "#2563EB",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
  },
});
