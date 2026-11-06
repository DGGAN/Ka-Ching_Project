// Import React, View, and Lucide vector icons for all transaction categories
import React from "react";
import { View } from "react-native";
import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  PiggyBank,
  MoreHorizontal,
  Briefcase,
  Gift,
  TrendingUp,
  PlusCircle,
} from "lucide-react-native";
import { COLORS, SHAPES } from "../theme/theme";

// 1. Master Category Visual Configuration Dictionary
export const CATEGORY_CONFIG = {
  // Expense Categories (8)
  FOOD_AND_BEVERAGE: {
    label: "Food & Drink",
    Icon: Utensils,
    bgColor: "#FFEDD5",
    iconColor: "#EA580C",
    type: "EXPENSE",
  },
  TRANSPORT: {
    label: "Transport",
    Icon: Car,
    bgColor: "#DBEAFE",
    iconColor: "#2563EB",
    type: "EXPENSE",
  },
  SHOPPING: {
    label: "Shopping",
    Icon: ShoppingBag,
    bgColor: "#FCE7F3",
    iconColor: "#DB2777",
    type: "EXPENSE",
  },
  BILLS_AND_UTILITIES: {
    label: "Bills & Utilities",
    Icon: Zap,
    bgColor: "#FEF9C3",
    iconColor: "#CA8A04",
    type: "EXPENSE",
  },
  LEISURE_AND_ENTERTAINMENT: {
    label: "Entertainment",
    Icon: Film,
    bgColor: "#F3E8FF",
    iconColor: "#9333EA",
    type: "EXPENSE",
  },
  HEALTH_AND_WELLNESS: {
    label: "Health & Medical",
    Icon: HeartPulse,
    bgColor: "#FFE4E6",
    iconColor: "#E11D48",
    type: "EXPENSE",
  },
  EDUCATION: {
    label: "Education",
    Icon: GraduationCap,
    bgColor: "#E0E7FF",
    iconColor: "#4F46E5",
    type: "EXPENSE",
  },
  OTHER_EXPENSE: {
    label: "Other Expense",
    Icon: MoreHorizontal,
    bgColor: "#F3F4F6",
    iconColor: "#4B5563",
    type: "EXPENSE",
  },

  // Income / Savings Categories (5)
  SAVINGS_AND_INVESTMENT: {
    label: "Savings & Invest",
    Icon: PiggyBank,
    bgColor: "#CCFBF1",
    iconColor: "#0D9488",
    type: "INCOME",
  },
  SALARY: {
    label: "Salary / Allowance",
    Icon: Briefcase,
    bgColor: "#DCFCE7",
    iconColor: "#16A34A",
    type: "INCOME",
  },
  FREELANCE: {
    label: "Side Income",
    Icon: TrendingUp,
    bgColor: "#D1FAE5",
    iconColor: "#059669",
    type: "INCOME",
  },
  GIFT: {
    label: "Gift / Bonus",
    Icon: Gift,
    bgColor: "#FEF3C7",
    iconColor: "#D97706",
    type: "INCOME",
  },
  OTHER_INCOME: {
    label: "Other Income",
    Icon: PlusCircle,
    bgColor: "#E0F2FE",
    iconColor: "#0284C7",
    type: "INCOME",
  },
};

// 2. Category Key Lists for Expense vs Income Modals
export const EXPENSE_CATEGORY_KEYS = [
  "FOOD_AND_BEVERAGE",
  "TRANSPORT",
  "SHOPPING",
  "BILLS_AND_UTILITIES",
  "LEISURE_AND_ENTERTAINMENT",
  "HEALTH_AND_WELLNESS",
  "EDUCATION",
  "OTHER_EXPENSE",
];

export const INCOME_CATEGORY_KEYS = ["SALARY", "FREELANCE", "GIFT", "SAVINGS_AND_INVESTMENT", "OTHER_INCOME"];

// 3. Universal Category Icon Badge Component (Dynamically binds to live theme border & radius)
export const CategoryBadge = ({ category, size = 34, iconSize = 16 }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER_EXPENSE;
  const IconComponent = config.Icon;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.min(size / 2, SHAPES.chipRadius),
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: config.bgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconComponent size={iconSize} color={config.iconColor} strokeWidth={2.2} />
    </View>
  );
};
