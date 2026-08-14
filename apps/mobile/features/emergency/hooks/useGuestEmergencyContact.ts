import { useCallback, useEffect, useState } from "react";
import type {
  GuestEmergencyContact,
  GuestEmergencyContactInput,
} from "../models/guestEmergencyContact.types";
import {
  readGuestEmergencyContact,
  saveGuestEmergencyContact,
} from "../services/guestEmergencyContactStorage";
import { validateGuestEmergencyContact } from "../utils/guestEmergencyContactValidators";

export function useGuestEmergencyContact({ enabled }: { enabled: boolean }) {
  const [contact, setContact] = useState<GuestEmergencyContact | null>(null);
  const [loaded, setLoaded] = useState(!enabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setContact(null);
      setLoaded(true);
      return;
    }

    let alive = true;
    setLoaded(false);
    void readGuestEmergencyContact()
      .then((stored) => {
        if (alive) setContact(stored);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });

    return () => {
      alive = false;
    };
  }, [enabled]);

  const save = useCallback(async (input: GuestEmergencyContactInput) => {
    const validation = validateGuestEmergencyContact(input);
    if (!validation.value) {
      return { contact: null, errors: validation.errors } as const;
    }

    const next: GuestEmergencyContact = {
      ...validation.value,
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      await saveGuestEmergencyContact(next);
      setContact(next);
      return { contact: next, errors: {} } as const;
    } finally {
      setSaving(false);
    }
  }, []);

  return { contact, loaded, saving, save };
}
