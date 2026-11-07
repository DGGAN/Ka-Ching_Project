// Import React, View, StyleSheet, and Lucide vector icons
import React from "react";
import { View, StyleSheet } from "react-native";
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
  Coins,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
  HelpCircle,
} from "lucide-react-native";
import { COLORS, SHAPES } from "../theme/theme";

// 1. Unified Category Configuration (Matches Backend Transaction.js 100%)
export const CATEGORY_CONFIG = {
  EXPENSE: [
    {
      key: "FOOD_AND_BEVERAGE",
      name: "Food & Beverage",
      label: "Food & Beverage",
      budgetType: "NEEDS",
      icon: Utensils,
      bgColor: "#FFEDD5",
      iconColor: "#EA580C",
      color: "#EA580C",
    },
    {
      key: "GROCERIES",
      name: "Groceries",
      label: "Groceries",
      budgetType: "NEEDS",
      icon: ShoppingCart,
      bgColor: "#DCFCE7",
      iconColor: "#16A34A",
      color: "#16A34A",
    },
    {
      key: "TRANSPORT",
      name: "Transportation",
      label: "Transportation",
      budgetType: "NEEDS",
      icon: Car,
      bgColor: "#DBEAFE",
      iconColor: "#2563EB",
      color: "#2563EB",
    },
    {
      key: "HOUSING",
      name: "Housing",
      label: "Housing",
      budgetType: "NEEDS",
      icon: Home,
      bgColor: "#EDE9FE",
      iconColor: "#7C3AED",
      color: "#7C3AED",
    },
    {
      key: "BILLS_AND_UTILITIES",
      name: "Bills & Utilities",
      label: "Bills & Utilities",
      budgetType: "NEEDS",
      icon: Zap,
      bgColor: "#FEF9C3",
      iconColor: "#CA8A04",
      color: "#CA8A04",
    },
    {
      key: "HEALTH_AND_WELLNESS",
      name: "Health & Wellness",
      label: "Health & Wellness",
      budgetType: "NEEDS",
      icon: HeartPulse,
      bgColor: "#FEE2E2",
      iconColor: "#DC2626",
      color: "#DC2626",
    },
    {
      key: "EDUCATION",
      name: "Education",
      label: "Education",
      budgetType: "NEEDS",
      icon: GraduationCap,
      bgColor: "#E0E7FF",
      iconColor: "#4F46E5",
      color: "#4F46E5",
    },
    {
      key: "SHOPPING",
      name: "Shopping",
      label: "Shopping",
      budgetType: "WANTS",
      icon: ShoppingBag,
      bgColor: "#FCE7F3",
      iconColor: "#DB2777",
      color: "#DB2777",
    },
    {
      key: "LEISURE_AND_ENTERTAINMENT",
      name: "Leisure & Entertainment",
      label: "Leisure & Entertainment",
      budgetType: "WANTS",
      icon: Film,
      bgColor: "#F3E8FF",
      iconColor: "#9333EA",
      color: "#9333EA",
    },
    {
      key: "OTHER_EXPENSE",
      name: "Other Expenses",
      label: "Other Expenses",
      budgetType: "WANTS",
      icon: MoreHorizontal,
      bgColor: "#F3F4F6",
      iconColor: "#4B5563",
      color: "#4B5563",
    },
  ],

  INCOME: [
    {
      key: "SALARY",
      name: "Salary",
      label: "Salary",
      icon: Briefcase,
      bgColor: "#DCFCE7",
      iconColor: "#15803D",
      color: "#15803D",
    },
    {
      key: "ALLOWANCE",
      name: "Allowance",
      label: "Allowance",
      icon: Coins,
      bgColor: "#D1FAE5",
      iconColor: "#059669",
      color: "#059669",
    },
    {
      key: "FREELANCE",
      name: "Freelance",
      label: "Freelance",
      icon: Laptop,
      bgColor: "#E0F2FE",
      iconColor: "#0284C7",
      color: "#0284C7",
    },
    {
      key: "INVESTMENT_RETURN",
      name: "Investment Returns",
      label: "Investment Returns",
      icon: TrendingUp,
      bgColor: "#CCFBF1",
      iconColor: "#0D9488",
      color: "#0D9488",
    },
    {
      key: "GIFT",
      name: "Gifts",
      label: "Gifts",
      icon: Gift,
      bgColor: "#FEF3C7",
      iconColor: "#D97706",
      color: "#D97706",
    },
    {
      key: "OTHER_INCOME",
      name: "Other Income",
      label: "Other Income",
      icon: PlusCircle,
      bgColor: "#E5E7EB",
      iconColor: "#374151",
      color: "#374151",
    },
  ],
};

// 2. Attach direct key lookup onto CATEGORY_CONFIG (e.g. CATEGORY_CONFIG["FOOD_AND_BEVERAGE"])
[...CATEGORY_CONFIG.EXPENSE, ...CATEGORY_CONFIG.INCOME].forEach((item) => {
  CATEGORY_CONFIG[item.key] = item;
});

// 3. Export helper key arrays for pickers and filters
export const EXPENSE_CATEGORY_KEYS = CATEGORY_CONFIG.EXPENSE.map((c) => c.key);
export const INCOME_CATEGORY_KEYS = CATEGORY_CONFIG.INCOME.map((c) => c.key);

// 4. Reusable Category Icon Badge Component
export const CategoryBadge = ({ category, size = 36, iconSize = 18 }) => {
  const styles = getStyles();
  const config = CATEGORY_CONFIG[category] || {
    name: category || "Other",
    label: category || "Other",
    icon: HelpCircle,
    bgColor: COLORS.secondary,
    iconColor: COLORS.text,
  };

  const IconComponent = config.icon;

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2.5,
          backgroundColor: config.bgColor,
          borderColor: COLORS.border,
        },
      ]}
    >
      <IconComponent size={iconSize} color={config.iconColor} strokeWidth={2.2} />
    </View>
  );
};

const getStyles = () =>
  StyleSheet.create({
    badgeContainer: {
      borderWidth: SHAPES.borderWidth,
      alignItems: "center",
      justifyContent: "center",
    },
  });
