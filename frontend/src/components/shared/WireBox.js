/**
 * @file frontend/src/components/shared/WireBox.js
 * @layer Shared Component (Atomic UI)
 * @description Theme-reactive bordered card container used across all screens.
 * @props {React.ReactNode} children - Inner card content
 * @props {object|Array} [style] - Custom container style overrides
 * @exports default WireBox
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, SHAPES } from "../../theme/colors";

export function WireBox({ children, style }) {
  return <View style={[getStyles().wireBox, style]}>{children}</View>;
}

const getStyles = () =>
  StyleSheet.create({
    wireBox: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 14,
      marginBottom: 14,
    },
  });

export default WireBox;
