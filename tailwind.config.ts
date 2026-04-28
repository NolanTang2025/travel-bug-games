import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      maxWidth: {
        /** Editorial column — consistent across marketing-style pages */
        page: "80rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        hand: ["Kalam", "Caveat", "cursive"],
        "hand-title": ["Caveat", "Kalam", "cursive"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "spin-play": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "tonearm-drop": {
          "0%": { transform: "rotate(0deg)" },
          "40%": { transform: "rotate(30deg)" },
          "60%": { transform: "rotate(26deg)" },
          "100%": { transform: "rotate(28deg)" },
        },
        "tonearm-lift": {
          "0%": { transform: "rotate(28deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "waveform-pulse": {
          "0%, 100%": { transform: "scaleY(0.35)", opacity: "0.6" },
          "50%": { transform: "scaleY(1)", opacity: "1" },
        },
        "shimmer-data": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scanline-subtle": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "holo-rotate": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "led-breathe": {
          "0%, 100%": { opacity: "0.35", boxShadow: "0 0 8px hsl(200 90% 52% / 0.2)" },
          "50%": { opacity: "1", boxShadow: "0 0 16px hsl(200 90% 52% / 0.55)" },
        },
        "vinyl-lift": {
          "0%": { transform: "translateY(0) rotate(0deg) scale(1)", opacity: "1" },
          "50%": { transform: "translateY(-40px) rotate(-8deg) scale(1.08)", opacity: "0.9" },
          "100%": { transform: "translateY(0) rotate(0deg) scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-play": "spin-play 1.8s linear infinite",
        "spin-play-slow": "spin-play 2.4s linear infinite",
        "tonearm-drop": "tonearm-drop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "tonearm-lift": "tonearm-lift 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "float-gentle": "float-gentle 4s ease-in-out infinite",
        "waveform-pulse": "waveform-pulse 0.85s ease-in-out infinite",
        "shimmer-data": "shimmer-data 2.5s linear infinite",
        "scanline-subtle": "scanline-subtle 6s linear infinite",
        "holo-rotate": "holo-rotate 18s linear infinite",
        "holo-rotate-slow": "holo-rotate 26s linear infinite",
        "led-breathe": "led-breathe 3s ease-in-out infinite",
        "vinyl-lift": "vinyl-lift 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
