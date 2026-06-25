"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

export type AutosaveState = "idle" | "saving" | "saved" | "error";

export function useAutosave<T extends Record<string, string>>({
  initialValues,
  onSave,
  delay = 700,
}: {
  initialValues: T;
  onSave: (values: T) => Promise<void>;
  delay?: number;
}) {
  const [values, setValues] = useState(initialValues);
  const [state, setState] = useState<AutosaveState>("idle");
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  const save = useCallback(
    (nextValues: T) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setState("saving");
        startTransition(async () => {
          try {
            await onSave(nextValues);
            setState("saved");
          } catch {
            setState("error");
          }
        });
      }, delay);
    },
    [delay, onSave],
  );

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    save(values);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [save, values]);

  return {
    values,
    setField: (name: keyof T, value: string) => setValues((current) => ({ ...current, [name]: value })),
    state: isPending ? "saving" as AutosaveState : state,
  };
}
