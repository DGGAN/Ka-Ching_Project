// Define high-contrast theme configurations including colors, shapes (border radius), and fonts
export const THEMES = {
  // Theme 1: Wireframe Monochrome (Sharp square corners + Monospace font)
  wireframe: {
    name: "Wireframe Mono",
    colors: {
      background: "#F0F0F0",
      card: "#FFFFFF",
      text: "#111111",
      textMuted: "#555555",
      primary: "#111111",
      primaryText: "#FFFFFF",
      secondary: "#E2E2E2",
      inputBg: "#F7F7F7",
      border: "#111111",
      borderMuted: "#BDBDBD",
      danger: "#D4183D",
      dangerBg: "#FFEBEE",
      success: "#15803D",
    },
    shapes: {
      cardRadius: 0,
      inputRadius: 0,
      buttonRadius: 0,
      chipRadius: 0,
      borderWidth: 2,
    },
    fonts: {
      regular: "monospace",
    },
  },

  // Theme 2: High-Contrast Cute Pastel Pink (Darkened text and borders for crisp readability)
  pastelPink: {
    name: "Sakura Cute Pink",
    colors: {
      background: "#FFF0F5", // Soft sakura pink background
      card: "#FFFFFF", // Pure white card for maximum contrast
      text: "#2B1420", // Deep espresso-plum text (super crisp)
      textMuted: "#6E475B", // Deep muted berry text (clearly legible)
      primary: "#E63E76", // Vibrant raspberry pink primary
      primaryText: "#FFFFFF", // Crisp white button text
      secondary: "#FFD6E4", // Distinct strawberry milk secondary block
      inputBg: "#FFF9FB", // Subtle pink input background
      border: "#C85A7C", // Crisp rose-pink solid border
      borderMuted: "#E598B2", // Visible soft pink dashed divider
      danger: "#D90429", // High-contrast error red
      dangerBg: "#FFE5EC", // Light red error background
      success: "#15803D", // High-contrast success green
    },
    shapes: {
      cardRadius: 18,
      inputRadius: 14,
      buttonRadius: 24,
      chipRadius: 16,
      borderWidth: 2, // 2px border for sharp definition
    },
    fonts: {
      regular: "sans-serif",
    },
  },

  // Theme 3: High-Contrast Ka-Ching Emerald Fintech
  emerald: {
    name: "Emerald Fintech",
    colors: {
      background: "#ECFDF5",
      card: "#FFFFFF",
      text: "#062016", // Ultra-dark forest green text
      textMuted: "#3B6352", // Crisp dark sage secondary text
      primary: "#059669", // Rich emerald primary for crisp white text
      primaryText: "#FFFFFF",
      secondary: "#D1FAE5",
      inputBg: "#F8FAFC",
      border: "#064E3B", // Deep emerald hard border
      borderMuted: "#6EE7B7",
      danger: "#DC2626",
      dangerBg: "#FEF2F2",
      success: "#047857",
    },
    shapes: {
      cardRadius: 12,
      inputRadius: 10,
      buttonRadius: 10,
      chipRadius: 8,
      borderWidth: 2,
    },
    fonts: {
      regular: "sans-serif",
    },
  },
};

// Switch here between 'wireframe' | 'pastelPink' | 'emerald'
export const ACTIVE_THEME_KEY = "wireframe";

// Export colors, shapes, and fonts of the currently active theme
export const COLORS = THEMES[ACTIVE_THEME_KEY].colors;
export const SHAPES = THEMES[ACTIVE_THEME_KEY].shapes;
export const FONTS = {
  mono: THEMES[ACTIVE_THEME_KEY].fonts.regular,
};
