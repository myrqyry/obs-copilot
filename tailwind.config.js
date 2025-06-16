/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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
      colors: {
        'gemini-blue': '#4285F4',
        'gemini-red': '#EA4335',
        'gemini-yellow': '#FBBC05',
        'gemini-green': '#34A853',
        'obs-dark': '#202020',
        'obs-light': '#E6E6E6',

        // Catppuccin Mocha palette
        'ctp-rosewater': '#f5e0dc',
        'ctp-flamingo': '#f2cdcd',
        'ctp-pink': '#f5c2e7',
        'ctp-mauve': '#cba6f7',
        'ctp-red': '#f38ba8',
        'ctp-maroon': '#eba0ac',
        'ctp-peach': '#fab387',
        'ctp-yellow': '#f9e2af',
        'ctp-green': '#a6e3a1',
        'ctp-teal': '#94e2d5',
        'ctp-sky': '#89dceb',
        'ctp-sapphire': '#74c7ec',
        'ctp-blue': '#89b4fa',
        'ctp-lavender': '#b4befe',
        'ctp-text': '#cdd6f4',
        'ctp-subtext1': '#bac2de',
        'ctp-subtext0': '#a6adc8',
        'ctp-overlay2': '#9399b2',
        'ctp-overlay1': '#7f849c',
        'ctp-overlay0': '#6c7086',
        'ctp-surface2': '#585b70',
        'ctp-surface1': '#45475a',
        'ctp-surface0': '#313244',
        'ctp-base': '#1e1e2e',
        'ctp-mantle': '#181825',
        'ctp-crust': '#11111b',

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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}