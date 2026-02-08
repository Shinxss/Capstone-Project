import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { VolunteerApplicationInput } from "../models/volunteerApplication.model";
import type {
  VolunteerValidationErrors,
  VolunteerFieldKey,
} from "../utils/volunteerApplication.validators";

type SectionKey =
  | "personal"
  | "contact"
  | "address"
  | "emergency"
  | "skills"
  | "certs"
  | "availability"
  | "preferred"
  | "health"
  | "verify"
  | "consent";

type Props = {
  form: VolunteerApplicationInput;
  setForm: React.Dispatch<React.SetStateAction<VolunteerApplicationInput>>;
  submitting: boolean;
  error: string | null;

  // ✅ validators
  errors: VolunteerValidationErrors;
  showErrors: boolean;

  submitDisabled: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

export function VolunteerApplicationView({
  form,
  setForm,
  submitting,
  error,
  errors,
  showErrors,
  submitDisabled,
  onBack,
  onSubmit,
}: Props) {
  const [open, setOpen] = useState<SectionKey>("personal");

  // ✅ show error automatically after user leaves an input (blur)
  const [touched, setTouched] = useState<
    Partial<Record<VolunteerFieldKey, boolean>>
  >({});

  const markTouched = (key: VolunteerFieldKey) =>
    setTouched((p) => ({ ...p, [key]: true }));

  const fieldError = (key: VolunteerFieldKey) => {
    if (!showErrors && !touched[key]) return undefined;
    return errors?.[key];
  };

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Volunteer Application</Text>
          <Text style={styles.headerSub}>Fill out the form below</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Accordion
          label="Section A"
          title="Personal Information"
          icon="person-outline"
          isOpen={open === "personal"}
          onToggle={() => setOpen(open === "personal" ? "contact" : "personal")}
        >
          <Field
            label="Full Name *"
            placeholder="e.g., Juan Miguel Dela Cruz"
            value={form.fullName}
            error={fieldError("fullName")}
            onBlur={() => markTouched("fullName")}
            onChangeText={(v) => setForm((p) => ({ ...p, fullName: v }))}
          />
          <Field
            label="Sex * (Male/Female)"
            placeholder="e.g., Male"
            value={String(form.sex ?? "")}
            error={fieldError("sex")}
            onBlur={() => markTouched("sex")}
            onChangeText={(v) => setForm((p) => ({ ...p, sex: v as any }))}
          />
          <Field
            label="Birthdate * (YYYY-MM-DD)"
            placeholder="e.g., 2004-03-12"
            value={form.birthdate}
            error={fieldError("birthdate")}
            onBlur={() => markTouched("birthdate")}
            onChangeText={(v) => setForm((p) => ({ ...p, birthdate: v }))}
          />
        </Accordion>

        <Accordion
          label="Section B"
          title="Contact Information"
          icon="call-outline"
          isOpen={open === "contact"}
          onToggle={() => setOpen(open === "contact" ? "address" : "contact")}
        >
          <Field
            label="Mobile Number *"
            placeholder="e.g., 09XXXXXXXXX"
            value={form.mobile}
            error={fieldError("mobile")}
            onBlur={() => markTouched("mobile")}
            keyboardType="phone-pad"
            onChangeText={(v) => setForm((p) => ({ ...p, mobile: v }))}
          />
          <Field
            label="Email (optional)"
            placeholder="e.g., juan@email.com"
            value={form.email}
            error={fieldError("email")}
            onBlur={() => markTouched("email")}
            onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
          />
        </Accordion>

        <Accordion
          label="Section C"
          title="Address"
          icon="location-outline"
          isOpen={open === "address"}
          onToggle={() => setOpen(open === "address" ? "emergency" : "address")}
        >
          <Field
            label="House No./Street (optional)"
            placeholder="e.g., 123 Rizal St., Purok 2"
            value={form.street}
            onChangeText={(v) => setForm((p) => ({ ...p, street: v }))}
          />
          <Field
            label="Barangay *"
            placeholder="e.g., Brgy. San Antonio"
            value={form.barangay}
            error={fieldError("barangay")}
            onBlur={() => markTouched("barangay")}
            onChangeText={(v) => setForm((p) => ({ ...p, barangay: v }))}
          />
          <Field
            label="City/Municipality"
            placeholder="e.g., Dagupan City"
            value={form.city}
            onChangeText={(v) => setForm((p) => ({ ...p, city: v }))}
          />
          <Field
            label="Province"
            placeholder="e.g., Pangasinan"
            value={form.province}
            onChangeText={(v) => setForm((p) => ({ ...p, province: v }))}
          />
        </Accordion>

        <Accordion
          label="Section D"
          title="Emergency Contact"
          icon="heart-outline"
          isOpen={open === "emergency"}
          onToggle={() => setOpen(open === "emergency" ? "skills" : "emergency")}
        >
          <Field
            label="Name *"
            placeholder="e.g., Maria Dela Cruz"
            value={form.emergencyContact?.name}
            error={fieldError("emergencyContact.name")}
            onBlur={() => markTouched("emergencyContact.name")}
            onChangeText={(v) =>
              setForm((p) => ({
                ...p,
                emergencyContact: { ...p.emergencyContact, name: v },
              }))
            }
          />
          <Field
            label="Relationship *"
            placeholder="e.g., Mother"
            value={form.emergencyContact?.relationship}
            error={fieldError("emergencyContact.relationship")}
            onBlur={() => markTouched("emergencyContact.relationship")}
            onChangeText={(v) =>
              setForm((p) => ({
                ...p,
                emergencyContact: { ...p.emergencyContact, relationship: v },
              }))
            }
          />
          <Field
            label="Contact Number *"
            placeholder="e.g., 09XXXXXXXXX"
            keyboardType="phone-pad"
            value={form.emergencyContact?.mobile}
            error={fieldError("emergencyContact.mobile")}
            onBlur={() => markTouched("emergencyContact.mobile")}
            onChangeText={(v) =>
              setForm((p) => ({
                ...p,
                emergencyContact: { ...p.emergencyContact, mobile: v },
              }))
            }
          />
        </Accordion>

        <Accordion
          label="Section E"
          title="Skills & Capabilities"
          icon="ribbon-outline"
          isOpen={open === "skills"}
          onToggle={() => setOpen(open === "skills" ? "certs" : "skills")}
        >
          <Field
            label="Other Skills (optional)"
            placeholder="e.g., First Aid, Logistics, Crowd Control"
            value={form.skillsOther}
            onChangeText={(v) => setForm((p) => ({ ...p, skillsOther: v }))}
          />
        </Accordion>

        <Accordion
          label="Section F"
          title="Certifications"
          icon="document-attach-outline"
          isOpen={open === "certs"}
          onToggle={() => setOpen(open === "certs" ? "availability" : "certs")}
        >
          <Field
            label="Certificates (optional)"
            placeholder="e.g., Red Cross First Aid (June 2025)"
            value={form.certificationsText}
            onChangeText={(v) =>
              setForm((p) => ({ ...p, certificationsText: v }))
            }
          />
        </Accordion>

        <Accordion
          label="Section G"
          title="Availability"
          icon="time-outline"
          isOpen={open === "availability"}
          onToggle={() =>
            setOpen(open === "availability" ? "preferred" : "availability")
          }
        >
          <Field
            label="Availability (optional)"
            placeholder="e.g., Weekends, after 5PM"
            value={form.availabilityText}
            onChangeText={(v) =>
              setForm((p) => ({ ...p, availabilityText: v }))
            }
          />
        </Accordion>

        <Accordion
          label="Section H"
          title="Preferred Assignment"
          icon="briefcase-outline"
          isOpen={open === "preferred"}
          onToggle={() => setOpen(open === "preferred" ? "health" : "preferred")}
        >
          <Field
            label="Preferred Assignment (optional)"
            placeholder="e.g., Field Volunteer / Support Volunteer"
            value={form.preferredAssignmentText}
            onChangeText={(v) =>
              setForm((p) => ({ ...p, preferredAssignmentText: v }))
            }
          />
        </Accordion>

        <Accordion
          label="Section J"
          title="Health & Safety"
          icon="medkit-outline"
          isOpen={open === "health"}
          onToggle={() => setOpen(open === "health" ? "verify" : "health")}
        >
          <Field
            label="Notes (optional)"
            placeholder="e.g., No allergies / Cannot lift heavy"
            value={form.healthNotes}
            onChangeText={(v) => setForm((p) => ({ ...p, healthNotes: v }))}
          />
        </Accordion>

        <Accordion
          label="Section K"
          title="Verification Requirements"
          icon="shield-checkmark-outline"
          isOpen={open === "verify"}
          onToggle={() => setOpen(open === "verify" ? "consent" : "verify")}
        >
          <Text style={styles.infoText}>
            Your application will be reviewed by the LGU for identity, address,
            and skills verification. You may be asked to submit Barangay
            Clearance or attend orientation.
          </Text>
        </Accordion>

        <Accordion
          label="Section L"
          title="Consent & Agreement"
          icon="document-text-outline"
          isOpen={open === "consent"}
          onToggle={() => setOpen("consent")}
        >
          <CheckRow
            checked={!!form.consent?.truth}
            text="I confirm the information provided is true and correct. *"
            error={fieldError("consent.truth")}
            onPress={() => {
              markTouched("consent.truth");
              setForm((p) => ({
                ...p,
                consent: { ...p.consent, truth: !p.consent.truth },
              }));
            }}
          />
          <CheckRow
            checked={!!form.consent?.rules}
            text="I agree to follow LGU/Lifeline safety rules and response protocols. *"
            error={fieldError("consent.rules")}
            onPress={() => {
              markTouched("consent.rules");
              setForm((p) => ({
                ...p,
                consent: { ...p.consent, rules: !p.consent.rules },
              }));
            }}
          />
          <CheckRow
            checked={!!form.consent?.data}
            text="I consent to the use of my data for emergency coordination and secure record-keeping. *"
            error={fieldError("consent.data")}
            onPress={() => {
              markTouched("consent.data");
              setForm((p) => ({
                ...p,
                consent: { ...p.consent, data: !p.consent.data },
              }));
            }}
          />
        </Accordion>

        <Pressable
          style={[styles.submitBtn, submitDisabled && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={submitDisabled}
        >
          <Text style={styles.submitText}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Accordion(props: {
  label: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Pressable style={styles.sectionHeader} onPress={props.onToggle}>
        <View style={styles.sectionIcon}>
          <Ionicons name={props.icon} size={20} color="#EF4444" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>{props.label}</Text>
          <Text style={styles.sectionTitle}>{props.title}</Text>
        </View>
        <Ionicons
          name={props.isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
      </Pressable>

      {props.isOpen ? (
        <View style={styles.sectionBody}>{props.children}</View>
      ) : null}
    </View>
  );
}

function Field(props: {
  label: string;
  value?: string; // ✅ allow undefined
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad";
  error?: string;
  onBlur?: () => void; // ✅ added
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{props.label}</Text>

      <TextInput
        value={props.value ?? ""} // ✅ prevents "length of undefined"
        onChangeText={props.onChangeText}
        onBlur={props.onBlur} // ✅ validate on blur
        keyboardType={props.keyboardType ?? "default"}
        placeholder={props.placeholder}
        placeholderTextColor="#9CA3AF"
        style={[styles.input, !!props.error && styles.inputError]}
      />

      {!!props.error && <Text style={styles.errorInline}>{props.error}</Text>}
    </View>
  );
}

function CheckRow(props: {
  checked: boolean;
  text: string;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Pressable style={styles.checkRow} onPress={props.onPress}>
        <View
          style={[
            styles.checkCircle,
            props.checked && styles.checkCircleOn,
            !!props.error && styles.checkCircleError,
          ]}
        >
          {props.checked ? (
            <Ionicons name="checkmark" size={14} color="#fff" />
          ) : null}
        </View>
        <Text style={styles.checkText}>{props.text}</Text>
      </Pressable>

      {!!props.error && <Text style={styles.errorInline}>{props.error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },

  header: {
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  headerSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },

  container: { padding: 16, paddingBottom: 140 },

  errorBox: {
    backgroundColor: "#B91C1C",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  errorText: { color: "#fff", fontWeight: "700", fontSize: 12, flex: 1 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "700" },
  sectionTitle: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "900",
    marginTop: 2,
  },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 14 },

  fieldLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#111827",
  },
  inputError: { borderColor: "#EF4444" },
  errorInline: {
    marginTop: 6,
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "700",
  },

  infoText: { fontSize: 12, color: "#6B7280", lineHeight: 16 },

  checkRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkCircleOn: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  checkCircleError: { borderColor: "#EF4444" },
  checkText: { flex: 1, fontSize: 12, color: "#111827", lineHeight: 16 },

  submitBtn: {
    marginTop: 14,
    backgroundColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
