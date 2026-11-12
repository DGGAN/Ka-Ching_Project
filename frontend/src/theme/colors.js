/**
 * @file frontend/src/theme/colors.js
 * @layer Theme Configuration (Multi-Theme Palette & Dynamic Runtime Mutator)
 * @description Defines all available color themes, shapes, fonts, and mutates COLORS in-place when applyTheme(themeKey) is called so all screens re-style immediately on Android, iOS, and Web.
 * @exports COLORS, SHAPES, FONTS, THEMES, ACTIVE_THEME, applyTheme
 */

import { Platform } from "react-native";

export const THEMES = {
  khaki: {
    id: "khaki",
    name: "Warm Khaki",
    subtitle: "Earthy & calm vintage ledger palette",
    previewColors: ["#937A50", "#F1ECE5", "#5F4E34"],
    palette: {
      background: "#F1ECE5",
      card: "#FAF7F2",
      primary: "#937A50",
      primaryText: "#FFFFFF",
      secondary: "#E6DEC8",
      inputBg: "#F5F0E6",
      text: "#2C2418",
      textMuted: "#6E5D46",
      border: "#5F4E34",
      borderMuted: "#B8A990",
      danger: "#E11D48",
      dangerBg: "#FFE4E6",
      success: "#15803D",
      successBg: "#DCFCE7",
    },
  },
  pink: {
    id: "pink",
    name: "Sakura Rose",
    subtitle: "Playful pastel pink & crisp ink borders",
    previewColors: ["#E87A90", "#FFF5F7", "#1E1B18"],
    palette: {
      background: "#FFF5F7",
      card: "#FFFFFF",
      primary: "#E87A90",
      primaryText: "#FFFFFF",
      secondary: "#FFE4E9",
      inputBg: "#FFF9FA",
      text: "#1E1B18",
      textMuted: "#6B5E62",
      border: "#1E1B18",
      borderMuted: "#D4B5BC",
      danger: "#E11D48",
      dangerBg: "#FFE4E6",
      success: "#15803D",
      successBg: "#DCFCE7",
    },
  },
  matcha: {
    id: "matcha",
    name: "Kyoto Matcha",
    subtitle: "Fresh botanical green for mindful saving",
    previewColors: ["#3B7A57", "#F2F7F4", "#1B2E23"],
    palette: {
      background: "#F2F7F4",
      card: "#FFFFFF",
      primary: "#3B7A57",
      primaryText: "#FFFFFF",
      secondary: "#DDF0E4",
      inputBg: "#F7FBF8",
      text: "#1B2E23",
      textMuted: "#526B5C",
      border: "#1B2E23",
      borderMuted: "#A3C2AF",
      danger: "#E11D48",
      dangerBg: "#FFE4E6",
      success: "#15803D",
      successBg: "#DCFCE7",
    },
  },
  ocean: {
    id: "ocean",
    name: "Nordic Ocean",
    subtitle: "Crisp coastal blue with high-contrast clarity",
    previewColors: ["#2563EB", "#F0F6FF", "#1E293B"],
    palette: {
      background: "#F0F6FF",
      card: "#FFFFFF",
      primary: "#2563EB",
      primaryText: "#FFFFFF",
      secondary: "#DBEAFE",
      inputBg: "#F8FAFC",
      text: "#1E293B",
      textMuted: "#64748B",
      border: "#1E293B",
      borderMuted: "#94A3B8",
      danger: "#E11D48",
      dangerBg: "#FFE4E6",
      success: "#15803D",
      successBg: "#DCFCE7",
    },
  },
  amber: {
    id: "amber",
    name: "Golden Duck",
    subtitle: "Warm honey gold inspired by the Ka-Ching mascot",
    previewColors: ["#D97706", "#FFFBEB", "#271C19"],
    palette: {
      background: "#FFFBEB",
      card: "#FFFFFF",
      primary: "#D97706",
      primaryText: "#FFFFFF",
      secondary: "#FEF3C7",
      inputBg: "#FFFDF5",
      text: "#271C19",
      textMuted: "#785A3C",
      border: "#271C19",
      borderMuted: "#D6B88A",
      danger: "#E11D48",
      dangerBg: "#FFE4E6",
      success: "#15803D",
      successBg: "#DCFCE7",
    },
  },
};

export let ACTIVE_THEME = "khaki";

// Initialize mutable COLORS object with the default theme palette
export const COLORS = {
  ...THEMES.khaki.palette,
};

// Mutate COLORS in-place so all components referencing COLORS update immediately on re-render
export const applyTheme = (themeKey) => {
  const cleanKey = String(themeKey || "khaki").split("_")[0];
  const targetTheme = THEMES[cleanKey] || THEMES.khaki;
  ACTIVE_THEME = targetTheme.id;
  Object.assign(COLORS, targetTheme.palette);
  return COLORS;
};

export const SHAPES = {
  borderWidth: 1.8,
  cardRadius: 12,
  buttonRadius: 10,
  inputRadius: 8,
  chipRadius: 8,
};

export const FONTS = {
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
};
