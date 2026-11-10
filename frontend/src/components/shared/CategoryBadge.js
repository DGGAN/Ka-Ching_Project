/**
 * @file frontend/src/components/shared/CategoryBadge.js
 * @layer Shared Component (Atomic UI)
 * @description Renders the colored icon badge for any of the 16 unified transaction categories.
 * @props {string} category - Category key (e.g., "FOOD_AND_BEVERAGE")
 * @props {number} [size=36] - Outer badge width and height in pixels
 * @props {number} [iconSize=17] - Inner Lucide icon size in pixels
 * @exports default CategoryBadge
 */

import React from "react";
import { View } from "react-native";
import {
  Utensils,
  ShoppingCart,
  Car,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Film,
  MoreHorizontal,
  Briefcase,
  Wallet,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
} from "lucide-react-native";
import { getCategoryMeta } from "../../utils/categoryConfig";

const ICON_COMPONENTS = {
  Utensils,
  ShoppingCart,
  Car,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Film,
  MoreHorizontal,
  Briefcase,
  Wallet,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
};

export function CategoryBadge({ category, size = 34, iconSize = 16 }) {
  const cfg = getCategoryMeta(category);
  const IconComp = ICON_COMPONENTS[cfg.iconName] || MoreHorizontal;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 2),
        backgroundColor: cfg.bgColor,
        borderWidth: 1.5,
        borderColor: cfg.color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconComp size={iconSize} color={cfg.color} strokeWidth={2.4} />
    </View>
  );
}

export default CategoryBadge;
