import { useState, useEffect, useCallback } from "react";
import storage from "@/lib/storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    return storage.get(key, initialValue);
  });

  const setLocalStorageValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setState((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        storage.set(key, next);
        return next;
      });
    },
    [key],
  );

  return [state, setLocalStorageValue] as const;
}
