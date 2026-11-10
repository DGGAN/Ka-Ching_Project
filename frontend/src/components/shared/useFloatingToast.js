/**
 * @file frontend/src/components/shared/useFloatingToast.js
 * @layer Shared Hook (UI Feedback State)
 * @description Manages animated slide-in/out state for non-blocking top floating toast notifications.
 * @exports useFloatingToast, default useFloatingToast
 */

import { useState, useRef } from "react";
import { Animated } from "react-native";

export function useFloatingToast() {
  const [toast, setToast] = useState(null);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const timerRef = useRef(null);

  const showToast = (type, message) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ type, message });

    Animated.timing(slideAnim, {
      toValue: 12,
      duration: 220,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setToast(null));
    }, 2600);
  };

  return { toast, slideAnim, showToast };
}

export default useFloatingToast;
