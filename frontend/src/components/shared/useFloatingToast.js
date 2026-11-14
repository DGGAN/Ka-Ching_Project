/**
 * @file frontend/src/components/shared/useFloatingToast.js
 * @layer Shared Hook (Floating Toast Banner Controller + Auto Error Sound)
 * @description Manages top-level toast notifications and automatically plays the "error" sound profile whenever an error toast is triggered.
 * @exports useFloatingToast, default useFloatingToast
 */

import { useState, useRef, useCallback } from "react";
import { Animated, Platform } from "react-native";
import { playUiSound } from "../../utils/soundEffects";

export function useFloatingToast() {
  const [toast, setToast] = useState(null);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const timerRef = useRef(null);

  const showToast = useCallback(
    (type = "info", message = "") => {
      if (!message) return;

      if (type === "error") {
        playUiSound("error");
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ type, message });
      slideAnim.setValue(-80);

      Animated.spring(slideAnim, {
        toValue: 12,
        friction: 7,
        tension: 65,
        useNativeDriver: Platform.OS !== "web",
      }).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -90,
          duration: 200,
          useNativeDriver: Platform.OS !== "web",
        }).start(() => {
          setToast(null);
        });
      }, 2800);
    },
    [slideAnim],
  );

  return { toast, slideAnim, showToast };
}

export default useFloatingToast;
