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
        vault: {
          black: "hsl(var(--vault-black))",
          platinum: "hsl(var(--vault-platinum))",
          gold: "hsl(var(--vault-gold))",
          green: "hsl(var(--vault-green))",
          red: "hsl(var(--vault-red))",
          "dark-gray": "hsl(var(--vault-dark-gray))",
          "mid-gray": "hsl(var(--vault-mid-gray))",
          "light-gray": "hsl(var(--vault-light-gray))",
          dynamic: "hsl(var(--vault-dynamic-accent))",
        },
        score: {
          excellent: "hsl(var(--score-excellent))",
          good: "hsl(var(--score-good))",
          average: "hsl(var(--score-average))",
          poor: "hsl(var(--score-poor))",
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
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "float-up": {
          "0%": { 
            transform: "translateY(0) scale(1)", 
            opacity: "1" 
          },
          "50%": {
            opacity: "0.8"
          },
          "100%": { 
            transform: "translateY(-150px) scale(0.3)", 
            opacity: "0" 
          },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "lock-open": {
          "0%": { 
            transform: "translateY(0) rotate(0deg)",
            opacity: "1"
          },
          "50%": {
            transform: "translateY(-8px) rotate(-5deg)",
          },
          "100%": { 
            transform: "translateY(-20px) rotate(-10deg)",
            opacity: "0.3"
          },
        },
        "color-shift": {
          "0%": { 
            filter: "hue-rotate(0deg) brightness(1)"
          },
          "100%": { 
            filter: "hue-rotate(90deg) brightness(1.2)"
          },
        },
        "particle-explode": {
          "0%": {
            transform: "translate(0, 0) scale(1)",
            opacity: "1"
          },
          "100%": {
            transform: "translate(var(--particle-x), var(--particle-y)) scale(0)",
            opacity: "0"
          }
        },
        "flash-burst": {
          "0%": {
            transform: "scale(0)",
            opacity: "1"
          },
          "50%": {
            transform: "scale(8)",
            opacity: "0.8"
          },
          "100%": {
            transform: "scale(20)",
            opacity: "0"
          }
        },
        "heartbeat": {
          "0%": {
            transform: "scale(1)",
            boxShadow: "0 0 60px hsla(var(--primary)/0.6)"
          },
          "5%": {
            transform: "scale(1.05)",
            boxShadow: "0 0 100px hsla(var(--primary)/0.9), 0 0 150px hsla(var(--accent)/0.5)"
          },
          "10%": {
            transform: "scale(1)",
            boxShadow: "0 0 60px hsla(var(--primary)/0.6)"
          },
          "15%": {
            transform: "scale(1.03)",
            boxShadow: "0 0 85px hsla(var(--primary)/0.8), 0 0 120px hsla(var(--accent)/0.4)"
          },
          "20%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 60px hsla(var(--primary)/0.6)"
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "glow": "glow 2s ease-in-out infinite",
        "float-up": "float-up 4s ease-out infinite",
        "lock-open": "lock-open 0.8s ease-out forwards",
        "color-shift": "color-shift 1s ease-in-out forwards",
        "particle-explode": "particle-explode 1.2s ease-out forwards",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
