/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Phase F1: Tactical Noir Primary Palette ────────────────────────
        'void-black': '#050505',
        'obsidian': '#0A0A0A',
        'charcoal': '#111111',
        'graphite': '#171717',
        'steel': '#242424',
        'ash': '#777777',
        'off-white': '#F2F0EA',

        // ── Semantic Accent Palette ───────────────────────────────────────
        'tactical-gold': '#C89B3C',
        'crimson': '#A83232',
        'warning-amber': '#D88932',
        'success-green': '#6F9F7A',
        'signal-cyan': '#6B9BA8',

        // ── Semantic Functional Surfaces & Foregrounds ─────────────────────
        bg: {
          void: '#050505',
          obsidian: '#0A0A0A',
          charcoal: '#111111',
          graphite: '#171717',
          surface: '#111111',
          card: '#0A0A0A',
          elevated: '#171717',
        },
        border: {
          subtle: '#1C1C1C',
          DEFAULT: '#242424',
          strong: '#383838',
          gold: '#C89B3C',
          crimson: '#A83232',
        },
        fg: {
          primary: '#F2F0EA',
          secondary: '#C8C4BC',
          muted: '#777777',
          subtle: '#4A4A4A',
          inverse: '#050505',
        },
        accent: {
          gold: '#C89B3C',
          crimson: '#A83232',
          amber: '#D88932',
          success: '#6F9F7A',
          signal: '#6B9BA8',
        },

        // ── Backward-Compatible Legacy Aliases (Preserves current components) ─
        'rally-bg': '#050505',
        'rally-bg-alt': '#0A0A0A',
        'rally-bg-subtle': '#111111',
        'rally-surface': '#111111',
        'rally-surface-card': '#0A0A0A',
        'rally-surface-raised': '#171717',
        'rally-border': '#242424',
        'rally-border-subtle': '#1C1C1C',
        'rally-text': '#F2F0EA',
        'rally-secondary': '#A39E93',
        'rally-muted': '#777777',
        'rally-red': '#A83232',
        'rally-critical': '#A83232',
        'rally-blue': '#6B9BA8',
        'rally-cyan': '#6B9BA8',
        'rally-green': '#6F9F7A',
        'rally-healthy': '#6F9F7A',
        'rally-amber': '#D88932',
        'rally-warning': '#D88932',
        'rally-gold': '#C89B3C',
        'rally-gray': '#777777',
      },
      borderRadius: {
        'none': '0px',
        'xs': '2px',
        'sm': '3px',
        DEFAULT: '4px',
        'md': '4px',
        'lg': '6px',
        'xl': '8px',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        editorial: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest: '.2em',
        tactical: '.12em',
        cinematic: '.25em',
      },
      boxShadow: {
        'tactical-sm': '0 1px 2px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(200, 155, 60, 0.05)',
        'tactical-gold': '0 0 15px -3px rgba(200, 155, 60, 0.15)',
        'tactical-crimson': '0 0 20px -3px rgba(168, 50, 50, 0.25)',
        'tactical-green': '0 0 15px -3px rgba(111, 159, 122, 0.2)',
        'surface-elevated': '0 4px 20px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      },
    },
  },
  plugins: [],
}
