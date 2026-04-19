import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

// ═══════════════════════════════════════════════════════════════════════
//  World Connect — Design System
//  Palette extraite du logo : Navy profond · Chrome argenté · Cyber bleu
// ═══════════════════════════════════════════════════════════════════════

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],

  darkMode: ["class"],

  theme: {
    extend: {

      // ─────────────────────────────────────────────────────────────
      //  PALETTE BRAND — extraite pixel par pixel du logo
      // ─────────────────────────────────────────────────────────────
      colors: {

        // ── Navy — fond principal du logo (bleu nuit profond) ──────
        navy: {
          50:  "#eef4fd",
          100: "#d4e3f8",
          200: "#a8c4f0",
          300: "#6b9ee8",
          400: "#3a6fd8",
          500: "#2152b8",   // bleu moyen logo
          600: "#1e3f8f",   // bleu actif
          700: "#1a3070",   // fond cards
          800: "#132560",   // fond header
          900: "#0d1f4e",   // fond principal ★
          950: "#070f2b",   // fond le plus sombre
        },

        // ── Silver — plaques métalliques coins du logo ─────────────
        silver: {
          50:  "#f8f9fc",
          100: "#f0f2f7",
          200: "#e4e7ef",
          300: "#d4d8e4",   // chrome clair
          400: "#c4c8d8",   // chrome médium ★
          500: "#adb2c8",
          600: "#9094a8",
          700: "#6e7280",
          800: "#4a4d60",
          900: "#2e3040",
          950: "#1a1c22",
        },

        // ── Cyber — couleur des chiffres binaires (bleu électrique) ─
        cyber: {
          50:  "#eff8ff",
          100: "#dff1ff",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60b0ff",
          500: "#4a9eff",   // binaire clair ★
          600: "#2e87f0",
          700: "#1a6fd4",
          800: "#1256a8",
          900: "#0e3e7a",
          950: "#071f3d",
        },

        // ── Globe White — icône globe du logo ──────────────────────
        globe: {
          DEFAULT: "#ffffff",
          muted:   "rgba(255,255,255,0.75)",
          subtle:  "rgba(255,255,255,0.40)",
          ghost:   "rgba(255,255,255,0.15)",
        },

        // ── Semantic tokens → CSS variables (Radix / next-themes) ──
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
      },

      // ─────────────────────────────────────────────────────────────
      //  GRADIENTS BRAND — reproduisent l'atmosphère du logo
      // ─────────────────────────────────────────────────────────────
      backgroundImage: {
        // Fond principal du logo (navy diagonal)
        "navy-radial":
          "radial-gradient(ellipse at 50% 40%, #1a3070 0%, #0d1f4e 55%, #070f2b 100%)",
        "navy-diagonal":
          "linear-gradient(135deg, #132560 0%, #0d1f4e 50%, #070f2b 100%)",

        // Effet chrome des plaques argentées
        "chrome":
          "linear-gradient(135deg, #d4d8e4 0%, #f0f2f7 35%, #adb2c8 60%, #e4e7ef 80%, #c4c8d8 100%)",
        "chrome-vertical":
          "linear-gradient(180deg, #f0f2f7 0%, #c4c8d8 40%, #d4d8e4 70%, #9094a8 100%)",

        // Glow bleu cyber (pour highlights, boutons actifs)
        "cyber-glow":
          "radial-gradient(ellipse at center, #4a9eff33 0%, transparent 70%)",

        // Overlay grille binaire (motif décoratif)
        "binary-overlay":
          "linear-gradient(180deg, transparent 0%, #0d1f4e88 100%)",

        // Carte glassmorphism sur fond navy
        "glass-navy":
          "linear-gradient(135deg, rgba(26,48,112,0.6) 0%, rgba(13,31,78,0.4) 100%)",

        // Bouton primaire brand
        "btn-primary":
          "linear-gradient(135deg, #2152b8 0%, #1a3070 100%)",
        "btn-primary-hover":
          "linear-gradient(135deg, #3a6fd8 0%, #2152b8 100%)",

        // Bordure brillante (effet silver stripe)
        "border-chrome":
          "linear-gradient(90deg, transparent, #c4c8d8, #f0f2f7, #c4c8d8, transparent)",
      },

      // ─────────────────────────────────────────────────────────────
      //  BOX SHADOWS — profondeur inspirée du logo
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        // Glow bleu cyber sur éléments actifs
        "cyber":        "0 0 20px rgba(74,158,255,0.4), 0 0 40px rgba(74,158,255,0.15)",
        "cyber-sm":     "0 0 8px rgba(74,158,255,0.5)",
        "cyber-lg":     "0 0 40px rgba(74,158,255,0.35), 0 0 80px rgba(74,158,255,0.1)",

        // Éclat chrome des plaques argentées
        "chrome":       "0 2px 20px rgba(196,200,216,0.4), inset 0 1px 0 rgba(255,255,255,0.6)",
        "chrome-inset": "inset 0 1px 3px rgba(255,255,255,0.5), inset 0 -1px 3px rgba(0,0,0,0.2)",

        // Cartes sur fond navy
        "card-navy":    "0 4px 24px rgba(7,15,43,0.6), 0 1px 4px rgba(7,15,43,0.4)",
        "card-navy-lg": "0 8px 48px rgba(7,15,43,0.8), 0 2px 8px rgba(7,15,43,0.5)",

        // Glow navy pour panneaux
        "navy-inner":   "inset 0 0 60px rgba(7,15,43,0.5)",
      },

      // ─────────────────────────────────────────────────────────────
      //  BORDER RADIUS
      // ─────────────────────────────────────────────────────────────
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
      },

      // ─────────────────────────────────────────────────────────────
      //  TYPOGRAPHIE — police nette et techno comme le logo
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        // Police principale (clean, lisible, moderne)
        sans:    ["var(--font-sans)", "Outfit", ...fontFamily.sans],
        // Police display (titres, nom "World Connect" en gras)
        display: ["var(--font-display)", "Exo 2", "Rajdhani", ...fontFamily.sans],
        // Police monospace (chiffres binaires, code)
        mono:    ["var(--font-mono)", "JetBrains Mono", ...fontFamily.mono],
      },

      // ─────────────────────────────────────────────────────────────
      //  ANIMATIONS — inspirées du mouvement du globe et de l'orbite
      // ─────────────────────────────────────────────────────────────
      keyframes: {
        // Radix UI
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },

        // Apparition douce
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to:   { opacity: "0", transform: "translateY(10px)" },
        },
        "fade-in-scale": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },

        // Glissement panneau
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)",    opacity: "1" },
          to:   { transform: "translateX(100%)", opacity: "0" },
        },
        "slide-in-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },

        // Rotation lente → globe qui tourne
        "globe-spin": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },

        // Orbite → trait orbital du logo
        "orbit": {
          from: { transform: "rotate(0deg) translateX(60px) rotate(0deg)" },
          to:   { transform: "rotate(360deg) translateX(60px) rotate(-360deg)" },
        },

        // Pulsation cyber — glow qui respire
        "cyber-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(74,158,255,0.4)" },
          "50%":       { boxShadow: "0 0 24px rgba(74,158,255,0.8), 0 0 48px rgba(74,158,255,0.3)" },
        },

        // Shimmer chrome — effet reflet métallique
        "chrome-shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },

        // Effet data stream — chiffres binaires qui défilent
        "data-stream": {
          "0%":   { transform: "translateY(-100%)", opacity: "0" },
          "10%":  { opacity: "1" },
          "90%":  { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },

        // Ping cyber — point de connexion
        "connection-ping": {
          "0%":   { transform: "scale(1)",    opacity: "1" },
          "75%":  { transform: "scale(2.5)",  opacity: "0" },
          "100%": { transform: "scale(2.5)",  opacity: "0" },
        },

        // Flottement léger
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-8px)" },
        },

        // Bounce subtil
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":       { transform: "translateY(-4px)" },
        },

        // Scan line (effet écran)
        "scan-line": {
          from: { transform: "translateY(-100%)" },
          to:   { transform: "translateY(100vh)" },
        },
      },

      animation: {
        // Radix
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",

        // Transitions UI
        "fade-in":         "fade-in 0.35s ease-out",
        "fade-out":        "fade-out 0.25s ease-in",
        "fade-in-scale":   "fade-in-scale 0.3s ease-out",
        "slide-in-right":  "slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1)",
        "slide-out-right": "slide-out-right 0.25s ease-in",
        "slide-in-up":     "slide-in-up 0.35s ease-out",

        // Brand
        "globe-spin":      "globe-spin 12s linear infinite",
        "orbit":           "orbit 8s linear infinite",
        "cyber-pulse":     "cyber-pulse 2.5s ease-in-out infinite",
        "chrome-shimmer":  "chrome-shimmer 3s linear infinite",
        "data-stream":     "data-stream 4s linear infinite",
        "connection-ping": "connection-ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
        "float":           "float 4s ease-in-out infinite",
        "bounce-subtle":   "bounce-subtle 2s ease-in-out infinite",
        "scan-line":       "scan-line 6s linear infinite",
      },

      // ─────────────────────────────────────────────────────────────
      //  BACKDROP BLUR — glassmorphism sur fond navy
      // ─────────────────────────────────────────────────────────────
      backdropBlur: {
        xs: "2px",
      },

      // ─────────────────────────────────────────────────────────────
      //  BREAKPOINTS
      // ─────────────────────────────────────────────────────────────
      screens: {
        xs:    "480px",
        "3xl": "1920px",
      },

      // ─────────────────────────────────────────────────────────────
      //  SPACING
      // ─────────────────────────────────────────────────────────────
      spacing: {
        "18":  "4.5rem",
        "88":  "22rem",
        "128": "32rem",
      },

      // ─────────────────────────────────────────────────────────────
      //  Z-INDEX
      // ─────────────────────────────────────────────────────────────
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
