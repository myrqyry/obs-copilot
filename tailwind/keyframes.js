module.exports = {
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
};
