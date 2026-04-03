import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useGoogleLogin } from "./useGoogleLogin";
import { DEFAULT_COUNTRY_REGION } from "../constants/countryRegionOptions";
import { buildDestinationPhone, normalizePhoneNumber } from "../utils/phoneAuth";

export function usePhoneRegistration() {
  const router = useRouter();
  const {
    start: onGoogle,
    loading: googleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleLogin();

  const [countryRegion, setCountryRegion] = useState(DEFAULT_COUNTRY_REGION);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destinationPhone = useMemo(
    () => buildDestinationPhone(countryRegion, phoneNumber),
    [countryRegion, phoneNumber]
  );

  const onSendOtp = useCallback(async () => {
    if (loading || googleLoading) return;

    setError(null);
    clearGoogleError();

    if (!countryRegion.trim()) {
      setError("Please enter your country or region.");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      setError("Please enter your phone number.");
      return;
    }

    const digitsOnlyCount = normalizedPhone.replace(/\D/g, "").length;
    if (digitsOnlyCount < 7) {
      setError("Phone number looks too short.");
      return;
    }

    setLoading(true);
    try {
      router.push({
        pathname: "/otp-verification",
        params: {
          mode: "phone",
          phone: destinationPhone,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [
    clearGoogleError,
    countryRegion,
    destinationPhone,
    googleLoading,
    loading,
    phoneNumber,
    router,
  ]);

  return {
    countryRegion,
    phoneNumber,
    loading: loading || googleLoading,
    googleLoading,
    error: error ?? googleError,
    setCountryRegion,
    setPhoneNumber,
    onSendOtp,
    onGoogle,
    goLogin: () => router.push("/(auth)/login"),
  };
}
