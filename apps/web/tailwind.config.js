/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // RALLY UI v3 — Command Center Palette
        'rally-bg': '#05070A',
        'rally-bg-alt': '#080B10',
        'rally-bg-subtle': '#0C1016',
        'rally-surface': '#10151C',
        'rally-surface-card': '#141A22',
        'rally-surface-raised': '#181F28',
        'rally-border': '#202833',
        'rally-border-subtle': '#29333E',
        'rally-text': '#F2F5F7',
        'rally-secondary': '#8B96A3',
        'rally-muted': '#687482',
        // Exact Signal Colors
        'rally-red': '#FF4655',
        'rally-critical': '#FF4655',
        'rally-blue': '#4DA3FF',
        'rally-cyan': '#55D6FF',
        'rally-green': '#35D07F',
        'rally-healthy': '#35D07F',
        'rally-amber': '#F4B942',
        'rally-warning': '#F4B942',
        'rally-gray': '#687482',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
