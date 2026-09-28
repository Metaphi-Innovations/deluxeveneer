import { useEffect, useState } from "react";

/** Returns `value` after it has stayed unchanged for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs = 450): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value === debouncedValue) {
      return;
    }

    // Apply empty values immediately so clear doesn't wait on debounce.
    if (value === "" || value === null || value === undefined) {
      setDebouncedValue(value);
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs, debouncedValue]);

  return debouncedValue;
}
