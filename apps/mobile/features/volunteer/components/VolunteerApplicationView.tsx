import React, { useMemo, useState } from "react";
import {
  Modal,
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
import { DAGUPAN_BARANGAY_OPTIONS } from "../../profile/constants/profileEdit.constants";
import {
  composeSkillsText,
  formatSkillsDisplayText,
  parseSkillState,
} from "../../profile/utils/skills";

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
  skillOptions: string[];
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
  skillOptions,
  submitting,
  error,
  errors,
  showErrors,
  submitDisabled,
  onBack,
  onSubmit,
}: Props) {
  const [open, setOpen] = useState<SectionKey>("personal");
  const [barangayPickerOpen, setBarangayPickerOpen] = useState(false);
  const [skillsPickerOpen, setSkillsPickerOpen] = useState(false);
  const [skillsSearchText, setSkillsSearchText] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkillEnabled, setOtherSkillEnabled] = useState(false);
  const [otherSkillText, setOtherSkillText] = useState("");

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

  const sectionFields: Record<Exclude<SectionKey, "verify">, VolunteerFieldKey[]> = {
    personal: ["fullName", "sex", "birthdate"],
    contact: ["mobile", "email"],
    address: ["barangay"],
    emergency: ["emergencyContact.name", "emergencyContact.relationship", "emergencyContact.mobile"],
    skills: [],
    certs: [],
    availability: [],
    preferred: [],
    health: [],
    consent: ["consent.truth", "consent.rules", "consent.data"],
  };

  const hasSectionError = (section: Exclude<SectionKey, "verify">) => {
    return sectionFields[section].some((key) => !!fieldError(key));
  };

  const normalizedSkillOptions = useMemo(() => {
    const cleaned = skillOptions.map((option) => option.trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
  }, [skillOptions]);

  const filteredSkillOptions = useMemo(() => {
    const query = skillsSearchText.trim().toLowerCase();
    if (!query) return normalizedSkillOptions;
    return normalizedSkillOptions.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [normalizedSkillOptions, skillsSearchText]);

  const syncSkillsToForm = (
    nextSelectedSkills: string[],
    nextOtherSkillEnabled: boolean,
    nextOtherSkillText: string
  ) => {
    const nextSkills = composeSkillsText(
      nextSelectedSkills,
      nextOtherSkillEnabled,
      nextOtherSkillText
    );
    setForm((prev) => ({ ...prev, skillsOther: nextSkills }));
  };

  const openSkillsSelector = () => {
    const parsed = parseSkillState(
      String(form.skillsOther ?? ""),
      normalizedSkillOptions
    );
    setSelectedSkills(parsed.selectedSkills);
    setOtherSkillEnabled(parsed.otherSkillEnabled);
    setOtherSkillText(parsed.otherSkillText);
    setSkillsSearchText("");
    setSkillsPickerOpen(true);
  };

  const onToggleSkill = (skill: string) => {
    const nextSelectedSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((item) => item !== skill)
      : [...selectedSkills, skill];

    setSelectedSkills(nextSelectedSkills);
    syncSkillsToForm(nextSelectedSkills, otherSkillEnabled, otherSkillText);
  };

  const onToggleOtherSkill = () => {
    const nextEnabled = !otherSkillEnabled;
    const nextText = nextEnabled ? otherSkillText : "";

    setOtherSkillEnabled(nextEnabled);
    if (!nextEnabled) {
      setOtherSkillText("");
    }

    syncSkillsToForm(selectedSkills, nextEnabled, nextText);
  };

  const onChangeOtherSkillText = (value: string) => {
    setOtherSkillText(value);
    syncSkillsToForm(selectedSkills, otherSkillEnabled, value);
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
          hasError={hasSectionError("personal")}
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
          hasError={hasSectionError("contact")}
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
          hasError={hasSectionError("address")}
          isOpen={open === "address"}
          onToggle={() => setOpen(open === "address" ? "emergency" : "address")}
        >
          <Field
            label="House No./Street (optional)"
            placeholder="e.g., 123 Rizal St., Purok 2"
            value={form.street}
            onChangeText={(v) => setForm((p) => ({ ...p, street: v }))}
          />
          <SelectField
            label="Barangay *"
            placeholder="Select barangay"
            value={form.barangay}
            error={fieldError("barangay")}
            onPress={() => {
              markTouched("barangay");
              setBarangayPickerOpen(true);
            }}
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
          hasError={hasSectionError("emergency")}
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
          hasError={hasSectionError("skills")}
          isOpen={open === "skills"}
          onToggle={() => setOpen(open === "skills" ? "certs" : "skills")}
        >
          <SelectField
            label="Skills (optional)"
            placeholder="Select skills"
            value={formatSkillsDisplayText(form.skillsOther)}
            onPress={openSkillsSelector}
          />
        </Accordion>

        <Accordion
          label="Section F"
          title="Certifications"
          icon="document-attach-outline"
          hasError={hasSectionError("certs")}
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
          hasError={hasSectionError("availability")}
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
          hasError={hasSectionError("preferred")}
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
          hasError={hasSectionError("health")}
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
          hasError={false}
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
          hasError={hasSectionError("consent")}
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

      <OptionPickerSheet
        visible={barangayPickerOpen}
        title="Select Barangay"
        options={[...DAGUPAN_BARANGAY_OPTIONS]}
        value={form.barangay}
        onClose={() => setBarangayPickerOpen(false)}
        onSelect={(nextBarangay) => {
          markTouched("barangay");
          setForm((p) => ({ ...p, barangay: nextBarangay }));
          setBarangayPickerOpen(false);
        }}
      />

      <SkillsPickerSheet
        visible={skillsPickerOpen}
        searchText={skillsSearchText}
        onChangeSearchText={setSkillsSearchText}
        options={filteredSkillOptions}
        selectedSkills={selectedSkills}
        otherSkillEnabled={otherSkillEnabled}
        otherSkillText={otherSkillText}
        onToggleSkill={onToggleSkill}
        onToggleOtherSkill={onToggleOtherSkill}
        onChangeOtherSkillText={onChangeOtherSkillText}
        onClose={() => setSkillsPickerOpen(false)}
      />
    </View>
  );
}

function Accordion(props: {
  label: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  hasError?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, props.hasError && styles.sectionCardError]}>
      <Pressable style={styles.sectionHeader} onPress={props.onToggle}>
        <View style={[styles.sectionIcon, props.hasError && styles.sectionIconError]}>
          <Ionicons name={props.icon} size={20} color={props.hasError ? "#B91C1C" : "#EF4444"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionLabel, props.hasError && styles.sectionLabelError]}>{props.label}</Text>
          <Text style={[styles.sectionTitle, props.hasError && styles.sectionTitleError]}>{props.title}</Text>
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

function SelectField(props: {
  label: string;
  value?: string;
  placeholder?: string;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <Pressable
        style={[styles.input, styles.inputPicker, !!props.error && styles.inputError]}
        onPress={props.onPress}
      >
        <Text style={[styles.inputPickerText, !props.value && styles.inputPlaceholder]}>
          {props.value?.trim() ? props.value : props.placeholder ?? ""}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </Pressable>
      {!!props.error && <Text style={styles.errorInline}>{props.error}</Text>}
    </View>
  );
}

function OptionPickerSheet(props: {
  visible: boolean;
  title: string;
  options: string[];
  value?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={props.onClose}>
        <Pressable style={styles.sheetCard} onPress={() => undefined}>
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <Text style={styles.sheetTitle}>{props.title}</Text>

          <ScrollView
            style={styles.sheetList}
            contentContainerStyle={styles.sheetListContent}
            showsVerticalScrollIndicator={false}
          >
            {props.options.map((option) => {
              const selected = option === props.value;
              return (
                <Pressable
                  key={option}
                  onPress={() => props.onSelect(option)}
                  style={styles.sheetOption}
                >
                  <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextSelected]}>
                    {option}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={18} color="#EF4444" />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable style={styles.sheetCloseBtn} onPress={props.onClose}>
            <Text style={styles.sheetCloseText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SkillsPickerSheet(props: {
  visible: boolean;
  searchText: string;
  onChangeSearchText: (value: string) => void;
  options: string[];
  selectedSkills: string[];
  otherSkillEnabled: boolean;
  otherSkillText: string;
  onToggleSkill: (skill: string) => void;
  onToggleOtherSkill: () => void;
  onChangeOtherSkillText: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={props.onClose}>
        <Pressable style={styles.sheetCard} onPress={() => undefined}>
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <Text style={styles.sheetTitle}>Select Skills</Text>

          <View style={styles.skillSearchWrap}>
            <Ionicons name="search-outline" size={18} color="#6B7280" />
            <TextInput
              value={props.searchText}
              onChangeText={props.onChangeSearchText}
              placeholder="Search skills"
              placeholderTextColor="#9CA3AF"
              style={styles.skillSearchInput}
            />
          </View>

          <ScrollView
            style={styles.sheetList}
            contentContainerStyle={styles.sheetListContent}
            showsVerticalScrollIndicator={false}
          >
            {props.options.map((option) => {
              const checked = props.selectedSkills.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() => props.onToggleSkill(option)}
                  style={styles.sheetOption}
                >
                  <Text style={[styles.sheetOptionText, checked && styles.sheetOptionTextSelected]}>
                    {option}
                  </Text>
                  <Ionicons
                    name={checked ? "checkbox-outline" : "square-outline"}
                    size={20}
                    color={checked ? "#EF4444" : "#9CA3AF"}
                  />
                </Pressable>
              );
            })}

            {props.options.length === 0 ? (
              <Text style={styles.sheetEmptyText}>No matching skills.</Text>
            ) : null}

            <Pressable style={styles.sheetOption} onPress={props.onToggleOtherSkill}>
              <Text
                style={[
                  styles.sheetOptionText,
                  props.otherSkillEnabled && styles.sheetOptionTextSelected,
                ]}
              >
                Other
              </Text>
              <Ionicons
                name={props.otherSkillEnabled ? "checkbox-outline" : "square-outline"}
                size={20}
                color={props.otherSkillEnabled ? "#EF4444" : "#9CA3AF"}
              />
            </Pressable>

            {props.otherSkillEnabled ? (
              <View style={styles.otherSkillWrap}>
                <TextInput
                  value={props.otherSkillText}
                  onChangeText={props.onChangeOtherSkillText}
                  placeholder="Type other skill"
                  placeholderTextColor="#9CA3AF"
                  style={styles.otherSkillInput}
                />
              </View>
            ) : null}
          </ScrollView>

          <Pressable style={styles.sheetCloseBtn} onPress={props.onClose}>
            <Text style={styles.sheetCloseText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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
  sectionCardError: { borderColor: "#EF4444" },
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
  sectionIconError: { backgroundColor: "#FEE2E2" },
  sectionLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "700" },
  sectionLabelError: { color: "#B91C1C" },
  sectionTitle: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "900",
    marginTop: 2,
  },
  sectionTitleError: { color: "#B91C1C" },
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
  inputPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputPickerText: {
    flex: 1,
    color: "#111827",
  },
  inputPlaceholder: {
    color: "#9CA3AF",
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

  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.52)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    maxHeight: "75%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    paddingBottom: 12,
  },
  sheetHandleWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
  sheetHandle: {
    width: 46,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
  },
  sheetTitle: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  skillSearchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skillSearchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 8,
  },
  sheetList: {
    flexGrow: 0,
  },
  sheetListContent: {
    paddingBottom: 8,
  },
  sheetOption: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetOptionText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  sheetOptionTextSelected: {
    color: "#EF4444",
    fontWeight: "800",
  },
  sheetEmptyText: {
    color: "#6B7280",
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  otherSkillWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  otherSkillInput: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sheetCloseBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  sheetCloseText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
});
