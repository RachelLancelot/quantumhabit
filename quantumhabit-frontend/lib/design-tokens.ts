/**
 * Design Tokens - Quantum Blue Theme
 * Generated from seed: c21d0e3e052a8db5376ec19ab8c266560fa7025fe8c76c8eac18cc9aa903af3a
 */

export const designTokens = {
  colors: {
    primary: {
      light: "#4A90E2",
      dark: "#3A7BC8",
    },
    secondary: {
      light: "#7B68EE",
      dark: "#6B58DE",
    },
    success: "#50C878",
    warning: "#FFB347",
    error: "#FF6B6B",
    neutral: {
      50: "#F8F9FA",
      100: "#E9ECEF",
      200: "#DEE2E6",
      300: "#CED4DA",
      400: "#ADB5BD",
      500: "#6C757D",
      600: "#495057",
      700: "#343A40",
      800: "#212529",
      900: "#1A1D24",
    },
  },
  spacing: {
    compact: {
      xs: "0.25rem", // 4px
      sm: "0.5rem", // 8px
      md: "0.75rem", // 12px
      lg: "1rem", // 16px
      xl: "1.5rem", // 24px
    },
    comfortable: {
      xs: "0.5rem", // 8px
      sm: "1rem", // 16px
      md: "1.5rem", // 24px
      lg: "2rem", // 32px
      xl: "3rem", // 48px
    },
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
    },
    lineHeight: {
      compact: 1.4,
      comfortable: 1.6,
    },
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
  },
  transitions: {
    default: "200ms ease-in-out",
    fast: "150ms ease-in-out",
    slow: "300ms ease-in-out",
  },
} as const;

