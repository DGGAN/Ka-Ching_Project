// Import Platform utility to select the appropriate system monospace font
import { Platform } from "react-native";

// 1. Default active theme key on startup (Warm Khaki Earth Palette)
export let ACTIVE_THEME = "kaching";

// 2. Complete dictionary of available visual themes for runtime switching
export const THEMES = {
  kaching: {
    id: "kaching",
    name: "Warm Khaki",
    subtitle: "Earthy oat, classic khaki & deep mocha palette",
    previewColors: ["#937A50", "#D7CBB6", "#5F4E34"],
    colors: {
      background: "#F1ECE5",
      card: "#FAF7F2",
      text: "#5F4E34",
      textMuted: "#937A50",
      border: "#5F4E34",
      borderMuted: "#C3B091",
      primary: "#937A50",
      primaryText: "#FFFFFF",
      secondary: "#D7CBB6",
      inputBg: "#F7F4EF",
      danger: "#C93B2B",
      dangerBg: "#FDE8E8",
      success: "#2E7D32",
    },
    shapes: {
      borderWidth: 1.6,
      cardRadius: 16,
      buttonRadius: 14,
      inputRadius: 12,
      chipRadius: 18,
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

  wireframe: {
    id: "wireframe",
    name: "Wireframe Mono",
    subtitle: "High-contrast brutalist black & white",
    previewColors: ["#121212", "#F4F4F4", "#FFFFFF"],
    colors: {
      background: "#F4F4F4",
      card: "#FFFFFF",
      text: "#121212",
      textMuted: "#666666",
      border: "#121212",
      borderMuted: "#CCCCCC",
      primary: "#121212",
      primaryText: "#FFFFFF",
      secondary: "#E8E8E8",
      inputBg: "#FAFAFA",
      danger: "#D9381E",
      dangerBg: "#FFF0EE",
      success: "#121212",
    },
    shapes: {
      borderWidth: 2,
      cardRadius: 4,
      buttonRadius: 4,
      inputRadius: 4,
      chipRadius: 4,
    },
  },
};

// 3. Safely resolve initial theme object with fallback to prevent undefined crashes
const initialThemeObj = THEMES[ACTIVE_THEME] || THEMES.kaching;

// 4. Mutable exported COLORS and SHAPES objects so components reflect theme updates
export const COLORS = { ...initialThemeObj.colors };
export const SHAPES = { ...initialThemeObj.shapes };

// 5. Function to dynamically mutate COLORS and SHAPES at runtime when user selects a new theme
export const applyTheme = (themeKey) => {
  const targetTheme = THEMES[themeKey] || THEMES.kaching;
  ACTIVE_THEME = targetTheme.id;
  Object.assign(COLORS, targetTheme.colors);
  Object.assign(SHAPES, targetTheme.shapes);
};

// 6. Unified typography font configuration
export const FONTS = {
  mono: Platform.OS === "ios" ? "Courier" : "monospace",
  sans: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
};
