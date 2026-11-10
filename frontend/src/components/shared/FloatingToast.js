/**
 * @file frontend/src/components/shared/FloatingToast.js
 * @layer Shared Component (Feedback UI)
 * @description Renders the animated top banner for success, warning, and error toast messages.
 * @props {object|null} toast - Active toast object ({ type, message })
 * @props {Animated.Value} slideAnim - Vertical translation animated value
 * @exports default FloatingToast
 */

import React from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { CheckCircle2, AlertTriangle } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";

export function FloatingToast({ toast, slideAnim }) {
  if (!toast) return null;
  const styles = getStyles();
  const isError = toast.type === "error";

  return (
    <Animated.View style={[styles.toastBanner, isError ? styles.toastError : styles.toastSuccess, { transform: [{ translateY: slideAnim }] }]}>
      {isError ? <AlertTriangle size={14} color="#FFFFFF" strokeWidth={2.5} /> : <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={2.5} />}
      <Text style={styles.toastText} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    toastBanner: {
      position: "absolute",
      top: 0,
      left: 16,
      right: 16,
      zIndex: 999,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: SHAPES.buttonRadius,
      borderWidth: 1.5,
      borderColor: COLORS.border,
    },
    toastSuccess: {
      backgroundColor: "#15803D",
    },
    toastError: {
      backgroundColor: COLORS.danger,
    },
    toastText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: "#FFFFFF",
      flex: 1,
    },
  });

export default FloatingToast;
