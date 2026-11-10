/**
 * @file frontend/src/utils/categoryConfig.js
 * @layer Utils (Pure Constants & Lookup Helpers)
 * @description Single source of truth for all 10 EXPENSE (NEEDS/WANTS) and 6 INCOME categories. Eliminates legacy category fallback bugs.
 * @exports CATEGORY_CONFIG, EXPENSE_CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, CATEGORY_MAP, getCategoryMeta, getCategoryBucketType
 */

// Pure configuration constants for the 16 standardized transaction categories (No React UI rendering here)
export const CATEGORY_CONFIG = {
  EXPENSE: [
    {
      key: "FOOD_AND_BEVERAGE",
      name: "Food & Beverage",
      budgetType: "NEEDS",
      iconName: "Utensils",
      color: "#EA580C",
      bgColor: "#FFEDD5",
    },
    {
      key: "GROCERIES",
      name: "Groceries",
      budgetType: "NEEDS",
      iconName: "ShoppingCart",
      color: "#16A34A",
      bgColor: "#DCFCE7",
    },
    {
      key: "TRANSPORT",
      name: "Transportation",
      budgetType: "NEEDS",
      iconName: "Car",
      color: "#0284C7",
      bgColor: "#E0F2FE",
    },
    {
      key: "HOUSING",
      name: "Housing",
      budgetType: "NEEDS",
      iconName: "Home",
      color: "#4F46E5",
      bgColor: "#E0E7FF",
    },
    {
      key: "BILLS_AND_UTILITIES",
      name: "Bills & Utilities",
      budgetType: "NEEDS",
      iconName: "Zap",
      color: "#D97706",
      bgColor: "#FEF3C7",
    },
    {
      key: "HEALTH_AND_WELLNESS",
      name: "Health & Wellness",
      budgetType: "NEEDS",
      iconName: "HeartPulse",
      color: "#E11D48",
      bgColor: "#FFE4E6",
    },
    {
      key: "EDUCATION",
      name: "Education",
      budgetType: "NEEDS",
      iconName: "GraduationCap",
      color: "#0D9488",
      bgColor: "#CCFBF1",
    },
    {
      key: "SHOPPING",
      name: "Shopping",
      budgetType: "WANTS",
      iconName: "ShoppingBag",
      color: "#DB2777",
      bgColor: "#FCE7F3",
    },
    {
      key: "LEISURE_AND_ENTERTAINMENT",
      name: "Leisure & Entertainment",
      budgetType: "WANTS",
      iconName: "Film",
      color: "#9333EA",
      bgColor: "#F3E8FF",
    },
    {
      key: "OTHER_EXPENSE",
      name: "Other Expenses",
      budgetType: "WANTS",
      iconName: "MoreHorizontal",
      color: "#64748B",
      bgColor: "#F1F5F9",
    },
  ],

  INCOME: [
    {
      key: "SALARY",
      name: "Salary",
      budgetType: "NONE",
      iconName: "Briefcase",
      color: "#15803D",
      bgColor: "#DCFCE7",
    },
    {
      key: "ALLOWANCE",
      name: "Allowance",
      budgetType: "NONE",
      iconName: "Wallet",
      color: "#0369A1",
      bgColor: "#E0F2FE",
    },
    {
      key: "FREELANCE",
      name: "Freelance",
      budgetType: "NONE",
      iconName: "Laptop",
      color: "#7E22CE",
      bgColor: "#F3E8FF",
    },
    {
      key: "INVESTMENT_RETURN",
      name: "Investment Returns",
      budgetType: "NONE",
      iconName: "TrendingUp",
      color: "#047857",
      bgColor: "#D1FAE5",
    },
    {
      key: "GIFT",
      name: "Gifts",
      budgetType: "NONE",
      iconName: "Gift",
      color: "#BE185D",
      bgColor: "#FCE7F3",
    },
    {
      key: "OTHER_INCOME",
      name: "Other Income",
      budgetType: "NONE",
      iconName: "PlusCircle",
      color: "#475569",
      bgColor: "#F1F5F9",
    },
  ],
};

export const EXPENSE_CATEGORIES = CATEGORY_CONFIG.EXPENSE;
export const INCOME_CATEGORIES = CATEGORY_CONFIG.INCOME;
export const EXPENSE_CATEGORY_KEYS = EXPENSE_CATEGORIES.map((c) => c.key);
export const INCOME_CATEGORY_KEYS = INCOME_CATEGORIES.map((c) => c.key);

export const NEEDS_CATEGORY_KEYS = EXPENSE_CATEGORIES.filter((c) => c.budgetType === "NEEDS").map((c) => c.key);

export const WANTS_CATEGORY_KEYS = EXPENSE_CATEGORIES.filter((c) => c.budgetType === "WANTS").map((c) => c.key);

export const CATEGORY_MAP = {};
[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].forEach((item) => {
  CATEGORY_MAP[item.key] = {
    ...item,
    label: item.name,
    iconColor: item.color,
  };
});

export const getCategoryMeta = (categoryKey) => {
  return (
    CATEGORY_MAP[categoryKey] ||
    CATEGORY_MAP.OTHER_EXPENSE || {
      key: "OTHER_EXPENSE",
      name: "Other Expenses",
      label: "Other Expenses",
      budgetType: "WANTS",
      iconName: "MoreHorizontal",
      color: "#64748B",
      bgColor: "#F1F5F9",
    }
  );
};

export const getCategoryBucketType = (categoryKey, explicitBudgetType = null) => {
  if (explicitBudgetType === "NEEDS" || explicitBudgetType === "WANTS") {
    return explicitBudgetType;
  }
  const meta = CATEGORY_MAP[categoryKey];
  if (meta && (meta.budgetType === "NEEDS" || meta.budgetType === "WANTS")) {
    return meta.budgetType;
  }
  return NEEDS_CATEGORY_KEYS.includes(categoryKey) ? "NEEDS" : "WANTS";
};
