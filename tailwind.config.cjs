/** @type {import('tailwindcss').Config} */
const { colorTokens } = require('./src/styles/theme/tokens');

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
        ...colorTokens,
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        obs: {
          connected: "hsl(var(--obs-connected))",
          disconnected: "hsl(var(--obs-disconnected))",
          recording: "hsl(var(--obs-recording))",
          streaming: "hsl(var(--obs-streaming))",
        },
        status: {
          live: "hsl(var(--status-live))",
          offline: "hsl(var(--status-offline))",
          pending: "hsl(var(--status-pending))",
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
        overlay: "hsl(var(--background-overlay))",
      },
      boxShadow: {
        // Glow effects
        'glow': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-lg': '0 0 40px hsl(var(--primary) / 0.4)',
        'glow-accent': '0 0 20px hsl(var(--accent) / 0.3)',
        'glow-accent-lg': '0 0 40px hsl(var(--accent) / 0.4)',

        // Neon effects
        'neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
        'neon-lg': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',

        // Glass morphism
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 12px 40px 0 rgba(31, 38, 135, 0.45)',
        'glass-xl': '0 16px 48px 0 rgba(31, 38, 135, 0.55)',

        // Soft shadows
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

        // Primary/Accent themed
        'primary': '0 4px 20px hsl(var(--primary) / 0.2)',
        'accent': '0 4px 20px hsl(var(--accent) / 0.2)',

        // Inner glow
        'inner-glow': 'inset 0 0 10px hsl(var(--primary) / 0.3)',
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
      transitionTimingFunction: {
        'custom-out': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'custom-out-2': 'cubic-bezier(0.2, 0.9, 0.2, 1)',
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
    require('@tailwindcss/container-queries'),
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
        '.glass-panel': {
            'background': 'rgba(255, 255, 255, 0.05)',
            'backdrop-filter': 'blur(12px)',
            'border': '1px solid rgba(255, 255, 255, 0.1)',
            'box-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
        '.glass-panel-dark': {
            'background': 'rgba(0, 0, 0, 0.2)',
            'backdrop-filter': 'blur(12px)',
            'border': '1px solid rgba(255, 255, 255, 0.05)',
            'box-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }
        ,
        '.card-elevated': {
          '@apply bg-card border border-border rounded-lg shadow-soft px-4 py-3': {},
        },
        '.btn-primary': {
          '@apply bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md': {},
        },
        '.input-field': {
          '@apply bg-input border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2': {},
        },
        '.flex-center': {
          '@apply flex items-center justify-center': {},
        },
        '.absolute-center': {
          '@apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2': {},
        },
        '.text-ellipsis-2': {
          'display': '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          'overflow': 'hidden',
        },
        '.text-ellipsis-3': {
          'display': '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          'overflow': 'hidden',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}
