/**
 * @file frontend/src/components/shared/useActionLock.js
 * @layer Shared Utility Hook (Synchronous Double-Tap & Spam Click Prevention)
 * @description Uses a synchronous ref lock + React state to immediately block rapid multi-taps on submit buttons (Budget, Add Transaction, OCR, Profile) before React finishes re-rendering.
 * @exports useActionLock
 */

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Wraps any async submit handler with a 0ms synchronous lock and optional post-completion cooldown.
 * @param {number} [cooldownMs=600] - Extra milliseconds to stay locked after the action finishes
 * @returns {{ isLocked: boolean, runLocked: (asyncFn: Function) => Promise<any> }}
 */
export function useActionLock(cooldownMs = 600) {
  const [isLocked, setIsLocked] = useState(false);
  const lockRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const runLocked = useCallback(
    async (asyncFn) => {
      // 0ms synchronous guard: blocks rapid double-taps immediately
      if (lockRef.current) return undefined;

      lockRef.current = true;
      setIsLocked(true);

      try {
        return await asyncFn();
      } finally {
        if (cooldownMs > 0) {
          timerRef.current = setTimeout(() => {
            lockRef.current = false;
            setIsLocked(false);
          }, cooldownMs);
        } else {
          lockRef.current = false;
          setIsLocked(false);
        }
      }
    },
    [cooldownMs],
  );

  return { isLocked, runLocked };
}
