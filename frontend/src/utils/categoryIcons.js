// Import React, native View component, and Lucide vector icons
import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Zap,
  HeartPulse,
  PiggyBank,
  HelpCircle,
  Briefcase,
  Wallet,
  TrendingUp,
  Gift,
  PlusCircle,
} from "lucide-react-native";
import { COLORS, SHAPES } from "../theme/theme";

// Array of 8 EXPENSE category keys
export const EXPENSE_CATEGORY_KEYS = [
  "FOOD_AND_BEVERAGE",
  "TRANSPORT",
  "SHOPPING",
  "LEISURE_AND_ENTERTAINMENT",
  "BILLS_AND_UTILITIES",
  "HEALTH_AND_EDUCATION",
  "SAVINGS_AND_INVESTMENT",
  "OTHER_EXPENSE",
];

// Array of 5 INCOME category keys
export const INCOME_CATEGORY_KEYS = ["SALARY", "ALLOWANCE", "INVESTMENT", "GIFT", "OTHER_INCOME"];

// Define pure English labels, icons, and color schemes for all 13 categories
export const CATEGORY_CONFIG = {
  // ─── q8 EXPENSE CATEGORIES ───
  // Food and Beverage category configuration
  FOOD_AND_BEVERAGE: {
    label: "Food & Drink",
    type: "EXPENSE",
    Icon: Utensils,
    bgColor: "#FFF0E6",
    iconColor: "#E85D04",
  },
  // Transport category configuration
  TRANSPORT: {
    label: "Transport",
    type: "EXPENSE",
    Icon: Car,
    bgColor: "#E6F4FF",
    iconColor: "#0077B6",
  },
  // Shopping category configuration
  SHOPPING: {
    label: "Shopping",
    type: "EXPENSE",
    Icon: ShoppingBag,
    bgColor: "#FFE5EC",
    iconColor: "#D90429",
  },
  // Leisure and Entertainment category configuration
  LEISURE_AND_ENTERTAINMENT: {
    label: "Leisure & Ent.",
    type: "EXPENSE",
    Icon: Gamepad2,
    bgColor: "#F3E8FF",
    iconColor: "#7209B7",
  },
  // Bills and Utilities category configuration
  BILLS_AND_UTILITIES: {
    label: "Bills & Util.",
    type: "EXPENSE",
    Icon: Zap,
    bgColor: "#FFF9DB",
    iconColor: "#D97706",
  },
  // Health and Education category configuration
  HEALTH_AND_EDUCATION: {
    label: "Health & Edu.",
    type: "EXPENSE",
    Icon: HeartPulse,
    bgColor: "#E8F8F5",
    iconColor: "#0F9D58",
  },
  // Savings and Investment category configuration
  SAVINGS_AND_INVESTMENT: {
    label: "Savings & Inv.",
    type: "EXPENSE",
    Icon: PiggyBank,
    bgColor: "#E0F2FE",
    iconColor: "#0284C7",
  },
  // Other Expense category configuration
  OTHER_EXPENSE: {
    label: "Other Expense",
    type: "EXPENSE",
    Icon: HelpCircle,
    bgColor: "#F1F5F9",
    iconColor: "#475569",
  },

  // Salary income category configuration
  SALARY: {
    label: "Salary",
    type: "INCOME",
    Icon: Briefcase,
    bgColor: "#DCFCE7",
    iconColor: "#15803D",
  },
  // Allowance income category configuration
  ALLOWANCE: {
    label: "Allowance",
    type: "INCOME",
    Icon: Wallet,
    bgColor: "#D1FAE5",
    iconColor: "#047857",
  },
  // Investment return category configuration
  INVESTMENT: {
    label: "Investment",
    type: "INCOME",
    Icon: TrendingUp,
    bgColor: "#E0E7FF",
    iconColor: "#4338CA",
  },
  // Gift income category configuration
  GIFT: {
    label: "Gift",
    type: "INCOME",
    Icon: Gift,
    bgColor: "#FCE7F3",
    iconColor: "#BE185D",
  },
  // Other Income category configuration
  OTHER_INCOME: {
    label: "Other Income",
    type: "INCOME",
    Icon: PlusCircle,
    bgColor: "#F3F4F6",
    iconColor: "#374151",
  },
};

// Export universal colorful category icon badge component
export const CategoryBadge = ({ category, size = 36, iconSize = 18 }) => {
  // Dynamically generate styles on every render so runtime theme switches apply immediately
  const styles = getStyles();

  // Fallback to OTHER_EXPENSE if category key is not found
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER_EXPENSE;
  const { Icon, bgColor, iconColor } = config;

  return (
    <View
      style={[
        styles.badgeBox,
        {
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderRadius: SHAPES.chipRadius > 0 ? size / 3 : 0,
        },
      ]}
    >
      <Icon size={iconSize} color={iconColor} strokeWidth={2.2} />
    </View>
  );
};

// Define badge border and alignment styles
const getStyles = () =>
  StyleSheet.create({
    badgeBox: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
  });
