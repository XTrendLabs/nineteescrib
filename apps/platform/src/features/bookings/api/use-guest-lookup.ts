import { useEffect, useState } from "react";

import { api } from "@/shared/lib/api-client";

/** Enough digits to narrow the directory without matching half of it. */
export const MIN_LOOKUP_DIGITS = 4;

/**
 * Holds a value back until it has stopped changing.
 *
 * Typing a phone number would otherwise fire a request per keystroke, most of
 * them for prefixes that can never match a full number.
 */
function useDebounced<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}

/**
 * Searches guests by partial phone number as it is typed.
 *
 * Matching is on digits, so a stored "+91 98765 43210" is found by typing any
 * run of its digits. Several guests can share a suffix, so this returns a list
 * to choose from rather than assuming the first hit is the right person.
 *
 * Held back until enough digits are in to be meaningful: searching on "9" would
 * match most of the directory and only add noise.
 */
export function useGuestLookup(phone: string) {
  const trimmed = phone.trim();
  const debounced = useDebounced(trimmed, 500);

  // Counted on digits so a country code and separators do not skew the check.
  const digits = debounced.replace(/\D/g, "");

  return api.api.platform.bookings.guests.lookup.$get.useQuery({
    query: { phone: debounced },
    enabled: digits.length >= MIN_LOOKUP_DIGITS,
    /**
     * The directory changes rarely, and typing a number walks through several
     * prefixes -- backspacing one digit should reuse the answer it already had
     * rather than pay another round-trip to a remote database.
     */
    staleTime: 60_000,
    // A half-typed number that matched nobody is not worth retrying; the next
    // keystroke asks a different question anyway.
    retry: false,
  });
}
