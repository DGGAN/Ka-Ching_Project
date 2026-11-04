// Import Platform utility to select the appropriate system monospace font
import { Platform } from "react-native";

// Default active theme key on startup
export let ACTIVE_THEME = "wireframe";

// Complete dictionary of available visual themes for runtime switching
export const THEMES = {
  wireframe: {
    id: "wireframe",
    name: "Wireframe Mono",
    subtitle: "High-contrast brutalist black & white",
    previewColors: ["#111111", "#F4F4F4", "#FFFFFF"],
    colors: {
      background: "#F4F4F4",
      card: "#FFFFFF",
      text: "#111111",
      textMuted: "#666666",
      border: "#222222",
      borderMuted: "#CCCCCC",
      primary: "#111111",
      primaryText: "#FFFFFF",
      secondary: "#E8E8E8",
      inputBg: "#FAFAFA",
      danger: "#D9381E",
      dangerBg: "#FFF0EE",
      success: "#111111",
    },
    shapes: {
      borderWidth: 2,
      cardRadius: 4,
      buttonRadius: 4,
      inputRadius: 4,
      chipRadius: 4,
    },
  },

  pink: {
    id: "pink",
    name: "Blossom Pink",
    subtitle: "Soft pastel rose with rounded cards",
    previewColors: ["#E87A90", "#FFF8FA", "#FFE5EC"],
    colors: {
      background: "#FFF8FA",
      card: "#FFFFFF",
      text: "#4A2C35",
      textMuted: "#9E7682",
      border: "#F2BAC9",
      borderMuted: "#FADCE4",
      primary: "#E87A90",
      primaryText: "#FFFFFF",
      secondary: "#FFE5EC",
      inputBg: "#FFFDFE",
      danger: "#E11D48",
      dangerBg: "#FFE4E6",
      success: "#10B981",
    },
    shapes: {
      borderWidth: 1.5,
      cardRadius: 18,
      buttonRadius: 25,
      inputRadius: 14,
      chipRadius: 20,
    },
  },

  emerald: {
    id: "emerald",
    name: "Prosperity Green",
    subtitle: "Fresh mint & emerald financial palette",
    previewColors: ["#10B981", "#F2FBF7", "#D1FAE5"],
    colors: {
      background: "#F2FBF7",
      card: "#FFFFFF",
      text: "#064E3B",
      textMuted: "#047857",
      border: "#6EE7B7",
      borderMuted: "#A7F3D0",
      primary: "#10B981",
      primaryText: "#FFFFFF",
      secondary: "#D1FAE5",
      inputBg: "#F9FEFC",
      danger: "#EF4444",
      dangerBg: "#FEE2E2",
      success: "#059669",
    },
    shapes: {
      borderWidth: 1.5,
      cardRadius: 16,
      buttonRadius: 14,
      inputRadius: 12,
      chipRadius: 16,
    },
  },
};

// Mutable exported COLORS and SHAPES objects so existing screens reflect updates when re-mounted
export const COLORS = { ...THEMES[ACTIVE_THEME].colors };
export const SHAPES = { ...THEMES[ACTIVE_THEME].shapes };

// Function to dynamically mutate COLORS and SHAPES at runtime when user selects a new theme
export const applyTheme = (themeKey) => {
  if (!THEMES[themeKey]) return;
  ACTIVE_THEME = themeKey;
  Object.assign(COLORS, THEMES[themeKey].colors);
  Object.assign(SHAPES, THEMES[themeKey].shapes);
};

// Unified typography font configuration
export const FONTS = {
  mono: Platform.OS === "ios" ? "Courier" : "monospace",
  sans: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
};
