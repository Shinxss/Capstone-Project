import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputKeyPressEventData,
  type NativeSyntheticEvent,
} from "react-native";

type OtpCodeInputProps = {
  digits: string[];
  onChangeDigits: (digits: string[]) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
};

function sanitizeDigits(digits: string[], length: number) {
  return Array.from({ length }, (_, index) => (digits[index] ?? "").replace(/\D/g, "").slice(0, 1));
}

export default function OtpCodeInput({
  digits,
  onChangeDigits,
  length = 6,
  disabled = false,
  hasError = false,
}: OtpCodeInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const safeDigits = useMemo(() => sanitizeDigits(digits, length), [digits, length]);

  const updateDigits = useCallback(
    (next: string[]) => {
      onChangeDigits(sanitizeDigits(next, length));
    },
    [length, onChangeDigits]
  );

  const focusInput = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(length - 1, index));
    inputRefs.current[clampedIndex]?.focus();
  }, [length]);

  const handlePress = useCallback(() => {
    const firstEmptyIndex = safeDigits.findIndex((digit) => digit === "");
    focusInput(firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex);
  }, [focusInput, length, safeDigits]);

  const handleChangeText = useCallback(
    (index: number, value: string) => {
      const numericText = value.replace(/\D/g, "");
      const nextDigits = [...safeDigits];

      if (!numericText) {
        nextDigits[index] = "";
        updateDigits(nextDigits);
        return;
      }

      if (numericText.length === 1) {
        nextDigits[index] = numericText;
        updateDigits(nextDigits);

        if (index < length - 1) {
          focusInput(index + 1);
        }
        return;
      }

      let cursor = index;
      for (const digit of numericText) {
        if (cursor >= length) break;
        nextDigits[cursor] = digit;
        cursor += 1;
      }

      updateDigits(nextDigits);

      if (cursor >= length) {
        inputRefs.current[length - 1]?.blur();
      } else {
        focusInput(cursor);
      }
    },
    [focusInput, length, safeDigits, updateDigits]
  );

  const handleKeyPress = useCallback(
    (index: number, event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (event.nativeEvent.key !== "Backspace") return;
      if (safeDigits[index]) return;
      if (index === 0) return;

      const nextDigits = [...safeDigits];
      nextDigits[index - 1] = "";
      updateDigits(nextDigits);
      focusInput(index - 1);
    },
    [focusInput, safeDigits, updateDigits]
  );

  return (
    <Pressable onPress={handlePress} disabled={disabled} style={styles.row}>
      {safeDigits.map((digit, index) => {
        const isActive = activeIndex === index;
        const borderColor = hasError ? "#DC2626" : isActive ? "#DC2626" : digit ? "#FCA5A5" : "#CBD5E1";
        const backgroundColor = disabled ? "#F8FAFC" : "#FFFFFF";

        return (
          <View
            key={`otp-digit-${index + 1}`}
            style={[
              styles.box,
              index < length - 1 ? styles.boxSpacing : null,
              {
                borderColor,
                backgroundColor,
              },
            ]}
          >
            <TextInput
              ref={(instance) => {
                inputRefs.current[index] = instance;
              }}
              value={digit}
              editable={!disabled}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={index === 0 ? length : 1}
              caretHidden={false}
              style={styles.input}
              onFocus={() => setActiveIndex(index)}
              onChangeText={(value) => handleChangeText(index, value)}
              onKeyPress={(event) => handleKeyPress(index, event)}
              returnKeyType="done"
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  box: {
    flex: 1,
    minWidth: 40,
    maxWidth: 48,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  boxSpacing: {
    marginRight: 8,
  },
  input: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#0F172A",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});
