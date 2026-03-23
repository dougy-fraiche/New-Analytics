import { useState, useCallback, useEffect } from "react";

/**
 * A useState-like hook that persists the value to localStorage.
 * Falls back to the default value if parsing fails or storage is unavailable.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // Ignore parse errors, use default
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [key, state]);

  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value);
    },
    []
  );

  return [state, setPersistedState];
}
