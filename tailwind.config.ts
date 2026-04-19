import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  // ─── Détection automatique des fichiers ────────────────────────
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],

  // ─── Dark mode via classe ──────────────────────────────────────
  darkMode: ["class"],

  theme: {
    extend: {

      // ─── Couleurs (CSS variables → next-themes compatible) ─────
      colors: {
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:   "hsl(var(--primary))",
          foreground:"hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:   "hsl(var(--secondary))",
          foreground:"hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:   "hsl(var(--muted))",
          foreground:"hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:   "hsl(var(--accent))",
          foreground:"hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:   "hsl(var(--destructive))",
          foreground:"hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT:   "hsl(var(--card))",
          foreground:"hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:   "hsl(var(--popover))",
          foreground:"hsl(var(--popover-foreground))",
        },
        border:  "hsl(var(--border))",
        input:   "hsl(var(--input))",
        ring:    "hsl(var(--ring))",
      },

      // ─── Border radius ─────────────────────────────────────────
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
      },

      // ─── Typographie ───────────────────────────────────────────
      fontFamily: {
        sans:  ["var(--font-sans)", ...fontFamily.sans],
        mono:  ["var(--font-mono)", ...fontFamily.mono],
        display: ["var(--font-display)", ...fontFamily.sans],
      },

      // ─── Animations ────────────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to:   { opacity: "0", transform: "translateY(8px)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(100%)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          to:   { transform: "rotate(360deg)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.3s ease-out",
        "fade-out":        "fade-out 0.3s ease-in",
        "slide-in-right":  "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-in",
        shimmer:           "shimmer 2s linear infinite",
        "spin-slow":       "spin-slow 3s linear infinite",
        "bounce-subtle":   "bounce-subtle 2s ease-in-out infinite",
      },

      // ─── Breakpoints custom ────────────────────────────────────
      screens: {
        xs:   "480px",
        "3xl":"1920px",
      },

      // ─── Spacing / Sizing custom ───────────────────────────────
      spacing: {
        "18":  "4.5rem",
        "88":  "22rem",
        "128": "32rem",
      },

      // ─── Z-index ───────────────────────────────────────────────
      zIndex: {
        "60":  "60",
        "70":  "70",
        "80":  "80",
        "90":  "90",
        "100": "100",
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};

export default config;
