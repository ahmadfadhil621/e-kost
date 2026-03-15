import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
        "status-available": "hsl(var(--status-available))",
        "status-available-foreground":
          "hsl(var(--status-available-foreground))",
        "status-occupied": "hsl(var(--status-occupied))",
        "status-occupied-foreground":
          "hsl(var(--status-occupied-foreground))",
        "status-renovation": "hsl(var(--status-renovation))",
        "status-renovation-foreground":
          "hsl(var(--status-renovation-foreground))",
        "balance-paid": "hsl(var(--balance-paid))",
        "balance-paid-foreground": "hsl(var(--balance-paid-foreground))",
        "balance-outstanding": "hsl(var(--balance-outstanding))",
        "balance-outstanding-foreground":
          "hsl(var(--balance-outstanding-foreground))",
        "finance-income": "hsl(var(--finance-income))",
        "finance-income-foreground": "hsl(var(--finance-income-foreground))",
        "finance-expense": "hsl(var(--finance-expense))",
        "finance-expense-foreground":
          "hsl(var(--finance-expense-foreground))",
        "finance-profit-positive": "hsl(var(--finance-profit-positive))",
        "finance-profit-negative": "hsl(var(--finance-profit-negative))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
