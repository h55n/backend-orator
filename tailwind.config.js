/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--color-border-subtle)",
        input: "var(--color-border-subtle)",
        ring: "var(--color-primary)",
        background: "var(--color-neutral)",
        foreground: "var(--color-on-surface)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-surface)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-surface)",
        },
        destructive: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-surface)",
        },
        muted: {
          DEFAULT: "var(--color-neutral)",
          foreground: "var(--color-secondary)",
        },
        accent: {
          DEFAULT: "var(--color-card-accent)",
          foreground: "var(--color-on-surface)",
        },
        card: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-on-surface)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
}
