/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // RALLY Design System
        'rally-black': '#07090C',
        'rally-charcoal': '#0D1117',
        'rally-graphite': '#151A21',
        'rally-surface': '#1B222C',
        'rally-border': '#28313C',
        'rally-text': '#F4F7FA',
        'rally-secondary': '#AAB4C0',
        'rally-muted': '#6F7A86',
        'rally-healthy': '#35D07F',
        'rally-info': '#4DA3FF',
        'rally-warning': '#F2B84B',
        'rally-critical': '#FF4D5A',
        'rally-neutral': '#8D99A6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
