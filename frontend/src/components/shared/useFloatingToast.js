/**
 * @file frontend/src/components/shared/useFloatingToast.js
 * @layer Shared Custom Hook
 * @description Manages top floating toast message state and vertical slide animation. Supports both named and default imports across all screens.
 * @exports useFloatingToast, default useFloatingToast
 */

import { useState, useRef, useCallback } from "react";
import { Animated, Platform } from "react-native";

export function useFloatingToast() {
  const [toast, setToast] = useState(null);
  const slideAnim = useRef(new Animated.Value(-90)).current;
  const timerRef = useRef(null);

  const showToast = useCallback(
    (type = "info", message = "") => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ type, message });
      slideAnim.setValue(-90);

      Animated.spring(slideAnim, {
        toValue: 0,
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
