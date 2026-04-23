import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Oyoun El Nile brand palette
        "nile-green": {
          DEFAULT: "#3E7D60",
          50: "#f0f9f4",
          100: "#d8f0e6",
          200: "#b3e0cd",
          300: "#7ec8a9",
          400: "#4fab83",
          500: "#3E7D60",
          600: "#2d6149",
          700: "#254e3c",
          800: "#1e3e30",
          900: "#173227",
        },
        "sand-ivory": "#F7F7D5",
        "mint-mist": "#C7E1D4",
        "sky-white": "#F0F7FF",
        navy: {
          DEFAULT: "#1C2D5B",
          50: "#f0f4ff",
          100: "#dde6ff",
          200: "#c2d1ff",
          300: "#97b2ff",
          400: "#6585f8",
          500: "#4060ef",
          600: "#2d40e4",
          700: "#2531cc",
          800: "#222aa5",
          900: "#1C2D5B",
        },
        // Semantic
        warning: "#D9A441",
        "border-neutral": "#DCE3EA",
        // shadcn/ui CSS variable mappings
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        rubik: ["Rubik", "sans-serif"],
        tajawal: ["Tajawal", "sans-serif"],
        "dm-sans": ["DM Sans", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        sans: ["Inter", "Tajawal", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover":
          "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
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
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
