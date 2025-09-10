/** @type {import('tailwindcss').Config} */
// Define catppuccin colors directly to avoid TypeScript import issues
const catppuccinMochaColors = {
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
  text: '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',
  surface2: '#585b70',
  surface1: '#45475a',
  surface0: '#313244',
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
  gemini: {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
  },
  obs: {
    dark: '#202020',
    light: '#E6E6E6',
  },
};

module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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

        ...catppuccinMochaColors,

        catppuccin: {
          latte: {
            rosewater: '#dc8a78',
            flamingo: '#dd7878',
            pink: '#ea76cb',
            mauve: '#8839ef',
            red: '#d20f39',
            maroon: '#e64553',
            peach: '#fe640b',
            yellow: '#df8e1d',
            green: '#40a02b',
            teal: '#179299',
            sky: '#04a5e5',
            sapphire: '#209fb5',
            blue: '#1e66f5',
            lavender: '#7287fd',
            text: '#4c4f69',
            subtext1: '#5c5f77',
            subtext0: '#6c6f85',
            overlay2: '#7c7f93',
            overlay1: '#8c8fa1',
            overlay0: '#9ca0b0',
            surface2: '#acb0be',
            surface1: '#bcc0cc',
            surface0: '#ccd0da',
            base: '#eff1f5',
            mantle: '#e6e9ef',
            crust: '#dce0e8',
          },
          frappe: {
            rosewater: '#f2d5cf',
            flamingo: '#eebebe',
            pink: '#f4b8e4',
            mauve: '#ca9ee6',
            red: '#e78284',
            maroon: '#ea999c',
            peach: '#ef9f76',
            yellow: '#e5c890',
            green: '#a6d189',
            teal: '#81c8be',
            sky: '#99d1db',
            sapphire: '#85c1dc',
            blue: '#8caaee',
            lavender: '#babbf1',
            text: '#c6d0f5',
            subtext1: '#b5bfe2',
            subtext0: '#a5adce',
            overlay2: '#949cbb',
            overlay1: '#838ba7',
            overlay0: '#737994',
            surface2: '#626880',
            surface1: '#51576d',
            surface0: '#414559',
            base: '#303446',
            mantle: '#292c3c',
            crust: '#232634',
          },
          macchiato: {
            rosewater: '#f4dbd6',
            flamingo: '#f0c6c6',
            pink: '#f5bde6',
            mauve: '#c6a0f6',
            red: '#ed8796',
            maroon: '#ee99a0',
            peach: '#f5a97f',
            yellow: '#eed49f',
            green: '#a6da95',
            teal: '#8bd5ca',
            sky: '#91d7e3',
            sapphire: '#7dc4e4',
            blue: '#8aadf4',
            lavender: '#b7bdf8',
            text: '#cad3f5',
            subtext1: '#b8c0e0',
            subtext0: '#a5adcb',
            overlay2: '#939ab7',
            overlay1: '#8087a2',
            overlay0: '#6e738d',
            surface2: '#5b6078',
            surface1: '#494d64',
            surface0: '#363a4f',
            base: '#24273a',
            mantle: '#1e2030',
            crust: '#181926',
          },
          mocha: {
            rosewater: '#f5e0dc',
            flamingo: '#f2cdcd',
            pink: '#f5c2e7',
            mauve: '#cba6f7',
            red: '#f38ba8',
            maroon: '#eba0ac',
            peach: '#fab387',
            yellow: '#f9e2af',
            green: '#a6e3a1',
            teal: '#94e2d5',
            sky: '#89dceb',
            sapphire: '#74c7ec',
            blue: '#89b4fa',
            lavender: '#b4befe',
            text: '#cdd6f4',
            subtext1: '#bac2de',
            subtext0: '#a6adc8',
            overlay2: '#9399b2',
            overlay1: '#7f849c',
            overlay0: '#6c7086',
            surface2: '#585b70',
            surface1: '#45475a',
            surface0: '#313244',
            base: '#1e1e2e',
            mantle: '#181825',
            crust: '#11111b',
          },
        },
        'rose-pine': {
          base: '#191724',
          surface: '#1f1d2e',
          overlay: '#26233a',
          muted: '#6e6a86',
          subtle: '#908caa',
          text: '#e0def4',
          love: '#eb6f92',
          gold: '#f6c177',
          rose: '#ebbcba',
          pine: '#31748f',
          foam: '#9ccfd8',
          iris: '#c4a7e7',
          highlightLow: '#21202e',
          highlightMed: '#403d52',
          highlightHigh: '#524f67',
        },
        'rose-pine-moon': {
          base: '#232136',
          surface: '#2a273f',
          overlay: '#393552',
          muted: '#6e6a86',
          subtle: '#908caa',
          text: '#e0def4',
          love: '#eb6f92',
          gold: '#f6c177',
          rose: '#ea9a97',
          pine: '#3e8fb0',
          foam: '#9ccfd8',
          iris: '#c4a7e7',
          highlightLow: '#2a283e',
          highlightMed: '#44415a',
          highlightHigh: '#56526e',
        },
        'rose-pine-dawn': {
          base: '#faf4ed',
          surface: '#fffaf3',
          overlay: '#f2e9e1',
          muted: '#9893a5',
          subtle: '#797593',
          text: '#575279',
          love: '#b4637a',
          gold: '#ea9d34',
          rose: '#d7827e',
          pine: '#286983',
          foam: '#56949f',
          iris: '#907aa9',
          highlightLow: '#f4ede8',
          highlightMed: '#dfdad9',
          highlightHigh: '#cecacd',
        },
        dracula: {
          background: '#282a36',
          currentLine: '#44475a',
          foreground: '#f8f8f2',
          comment: '#6272a4',
          cyan: '#8be9fd',
          green: '#50fa7b',
          orange: '#ffb86c',
          pink: '#ff79c6',
          purple: '#bd93f9',
          red: '#ff5555',
          yellow: '#f1fa8c',
        },
        nord: {
          'polar-night': {
            0: '#2E3440',
            1: '#3B4252',
            2: '#434C5E',
            3: '#4C566A',
          },
          'snow-storm': {
            4: '#D8DEE9',
            5: '#E5E9F0',
            6: '#ECEFF4',
          },
          frost: {
            7: '#8FBCBB',
            8: '#88C0D0',
            9: '#81A1C1',
            10: '#5E81AC',
          },
          aurora: {
            11: '#BF616A',
            12: '#D08770',
            13: '#EBCB8B',
            14: '#A3BE8C',
            15: '#B48EAD',
          },
        },
        'solarized-dark': {
          base03: '#002b36',
          base02: '#073642',
          base01: '#586e75',
          base00: '#657b83',
          base0: '#839496',
          base1: '#93a1a1',
          base2: '#eee8d5',
          base3: '#fdf6e3',
          yellow: '#b58900',
          orange: '#cb4b16',
          red: '#dc322f',
          magenta: '#d33682',
          violet: '#6c71c4',
          blue: '#268bd2',
          cyan: '#2aa198',
          green: '#859900',
        },
        'solarized-light': {
          base03: '#fdf6e3',
          base02: '#eee8d5',
          base01: '#93a1a1',
          base00: '#839496',
          base0: '#657b83',
          base1: '#586e75',
          base2: '#073642',
          base3: '#002b36',
          yellow: '#b58900',
          orange: '#cb4b16',
          red: '#dc322f',
          magenta: '#d33682',
          violet: '#6c71c4',
          blue: '#268bd2',
          cyan: '#2aa198',
          green: '#859900',
        },
        'gruvbox-dark': {
          bg: '#282828',
          fg: '#ebdbb2',
          red: '#cc241d',
          green: '#98971a',
          yellow: '#d79921',
          blue: '#458588',
          purple: '#b16286',
          aqua: '#689d6a',
          gray: '#a89984',
          orange: '#d65d0e',
        },
        'gruvbox-light': {
          bg: '#fbf1c7',
          fg: '#3c3836',
          red: '#cc241d',
          green: '#98971a',
          yellow: '#d79921',
          blue: '#458588',
          purple: '#b16286',
          aqua: '#689d6a',
          gray: '#7c6f64',
          orange: '#d65d0e',
        },

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
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
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
      boxShadow: {
        glow: '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-lg': '0 0 40px hsl(var(--primary) / 0.4)',
        'glow-accent': '0 0 20px hsl(var(--accent) / 0.3)',
        'glow-accent-lg': '0 0 40px hsl(var(--accent) / 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.15)',
        'primary': '0 4px 20px hsl(var(--primary) / 0.2)',
        'accent': '0 4px 20px hsl(var(--accent) / 0.2)',
        'glow': '0 0 5px hsl(var(--primary)), 0 0 10px hsl(var(--primary)), 0 0 15px hsl(var(--primary))',
        'glow-lg': '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))',
        'glow-xl': '0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary)), 0 0 45px hsl(var(--primary))',
        'inner-glow': 'inset 0 0 10px hsl(var(--primary) / 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 12px 40px 0 rgba(31, 38, 135, 0.45)',
        'glass-xl': '0 16px 48px 0 rgba(31, 38, 135, 0.55)',
        'neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
        'neon-lg': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'ripple': 'ripple 0.6s linear',
        'gradient': 'gradient 3s ease infinite',
        "gradient-shift": "gradient-shift 12s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "spin-fast": "spin 0.5s linear infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-out": "fadeOut 0.5s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "scale-out": "scaleOut 0.2s ease-in",
        "rotate-in": "rotateIn 0.3s ease-out",
        "rotate-out": "rotateOut 0.3s ease-in",
        "flip-in": "flipIn 0.6s ease-out",
        "flip-out": "flipOut 0.6s ease-in",
        "zoom-in": "zoomIn 0.3s ease-out",
        "zoom-out": "zoomOut 0.3s ease-in",
        "shake": "shake 0.5s ease-in-out",
        "wiggle": "wiggle 0.5s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "sink": "sink 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2s linear infinite",
        "gradient": "gradient 3s ease infinite",
        "morph": "morph 4s ease-in-out infinite",
        "serviceSwitch": "serviceSwitch 0.3s ease-in-out",
        "modal-appear": "modal-appear var(--duration-normal) var(--ease-out)",
        "loading-shimmer": "loading-shimmer 1.5s infinite",
        "glass-fade-in": "glass-fade-in var(--duration-slow) var(--ease-out)"
      },
      keyframes: {
        ripple: {
          'to': {
            transform: 'scale(4)',
            opacity: '0',
          },
        },
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        "gradient-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" }
        },
        "serviceSwitch": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "modal-appear": {
          "0%": { opacity: "0", transform: "scale(0.9) translateY(-10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" }
        },
        "loading-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "glass-fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.95)", backdropFilter: "blur(0px)" },
          "50%": { backdropFilter: "blur(5px)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", backdropFilter: "blur(10px)" }
        },
        "rainbow-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" }
        },
        "enhanced-pulse": {
          "0%, 100%": { opacity: "1", "text-shadow": "0 0 12px currentColor, 0 0 24px currentColor" },
          "50%": { opacity: "0.8", "text-shadow": "0 0 16px currentColor, 0 0 32px currentColor, 0 0 48px currentColor" }
        },
        "sparkle": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
          "25%": { transform: "scale(1.2) rotate(90deg)", opacity: "0.8" },
          "50%": { transform: "scale(0.8) rotate(180deg)", opacity: "0.6" },
          "75%": { transform: "scale(1.1) rotate(270deg)", opacity: "0.9" }
        },
        "gentle-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.85" }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "sink": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(10px)" }
        },
        "fadeIn": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "fadeOut": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        },
        "slideUp": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "slideDown": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "scaleIn": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        "scaleOut": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.9)", opacity: "0" }
        },
        "rotateIn": {
          "0%": { transform: "rotate(-180deg)", opacity: "0" },
          "100%": { transform: "rotate(0deg)", opacity: "1" }
        },
        "rotateOut": {
          "0%": { transform: "rotate(0deg)", opacity: "1" },
          "100%": { transform: "rotate(180deg)", opacity: "0" }
        },
        "flipIn": {
          "0%": { transform: "perspective(400px) rotateY(90deg)", opacity: "0" },
          "40%": { transform: "perspective(400px) rotateY(-20deg)" },
          "60%": { transform: "perspective(400px) rotateY(10deg)" },
          "80%": { transform: "perspective(400px) rotateY(-5deg)" },
          "100%": { transform: "perspective(400px) rotateY(0deg)", opacity: "1" }
        },
        "flipOut": {
          "0%": { transform: "perspective(400px) rotateY(0deg)", opacity: "1" },
          "100%": { transform: "perspective(400px) rotateY(-90deg)", opacity: "0" }
        },
        "zoomIn": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        "zoomOut": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { opacity: "1" },
          "100%": { transform: "scale(0.3)", opacity: "0" }
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" }
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" }
        },
        "glow": {
          "0%": { "box-shadow": "0 0 5px currentColor" },
          "100%": { "box-shadow": "0 0 20px currentColor, 0 0 30px currentColor" }
        },
        "shimmer": {
          "0%": { "background-position": "-200% 0" },
          "100%": { "background-position": "200% 0" }
        },
        "gradient": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" }
        },
        "morph": {
          "0%, 100%": { "border-radius": "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "50%": { "border-radius": "30% 60% 70% 40% / 50% 60% 30% 60%" }
        },
        "highlight-fade": {
          "0%": { "background-position": "200% 0" },
          "100%": { "background-position": "-200% 0" }
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionProperty: {
        'height': 'height',
        'opacity-transform': 'opacity, transform',
        'all': 'all',
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
        'spacing': 'margin, padding',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      },
      backgroundSize: {
        'auto': 'auto',
        'cover': 'cover',
        'contain': 'contain',
        '200%': '200%',
        '300%': '300%',
      },
      zIndex: {
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      minHeight: {
        'screen-75': '75vh',
        'screen-50': '50vh',
      },
      maxHeight: {
        'screen-75': '75vh',
        'screen-50': '50vh',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('tailwind-scrollbar')({ nocompatible: true }),
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-none': {
          'scrollbar-width': 'none',
        },
        '.backdrop-blur-xs': {
          'backdrop-filter': 'blur(2px)',
        },
        '.glass-effect': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-effect-dark': {
          'background': 'rgba(0, 0, 0, 0.05)',
          'backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.text-gradient': {
          'background': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.bg-gradient-primary': {
          'background': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
        },
        '.shadow-glow': {
          'box-shadow': '0 0 20px rgba(var(--primary), 0.3)',
        },
        '.shadow-glow-lg': {
          'box-shadow': '0 0 30px rgba(var(--primary), 0.4)',
        },
        '.shadow-glow-xl': {
          'box-shadow': '0 0 40px rgba(var(--primary), 0.5)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
