import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // V2 Semantic tokens (map to CSS variables)
        'bg': 'var(--bg)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',

        // Brand (single accent)
        'accent': {
          DEFAULT: 'var(--accent-1)',
          weak: 'var(--accent-2)',
        },

        // Semantic
        'pos': 'var(--pos)',
        'neg': 'var(--neg)',
        'warn': 'var(--warn)',

        // Backward compat — existing class names
        'deep-navy': '#0F2B46',
        'electric-blue': 'var(--accent-1)',
        'teal': 'var(--pos)',
        'amber': 'var(--warn)',
        'red': 'var(--neg)',

        // Mode-specific (backward compat)
        'dark-bg': '#0C0F17',
        'dark-card': '#13161F',
        'dark-hover': '#1C1F2A',
        'dark-border': '#232736',
        'dark-text': '#E0E2E8',
        'dark-text-secondary': '#8B919E',

        'light-bg': '#F7F8FA',
        'light-card': '#FFFFFF',
        'light-hover': '#F1F3F5',
        'light-border': '#E3E5EA',
        'light-text': '#1A1D23',
        'light-text-secondary': '#5A6170',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '6px',
        'lg': '8px',
        'xl': '8px',    // Collapse xl → lg (anti-template)
        '2xl': '8px',   // Collapse 2xl → lg
        '3xl': '8px',
        'full': '9999px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'caption': ['var(--text-caption)', { lineHeight: '1.45' }],
        'small': ['var(--text-small)', { lineHeight: '1.5' }],
        'body': ['var(--text-body)', { lineHeight: '1.5' }],
        'base': ['var(--text-base)', { lineHeight: '1.5' }],
        'subheading': ['var(--text-subheading)', { lineHeight: '1.35' }],
        'heading': ['var(--text-heading)', { lineHeight: '1.3' }],
        'title': ['var(--text-title)', { lineHeight: '1.2' }],
        'display': ['var(--text-display)', { lineHeight: '1.1' }],
        'hero': ['var(--text-hero)', { lineHeight: '1.05' }],
      },
      spacing: {
        'v2-1': 'var(--space-1)',
        'v2-2': 'var(--space-2)',
        'v2-3': 'var(--space-3)',
        'v2-4': 'var(--space-4)',
        'v2-5': 'var(--space-5)',
        'v2-6': 'var(--space-6)',
        'v2-8': 'var(--space-8)',
      },
      boxShadow: {
        'none': 'none',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'overlay': 'var(--shadow-overlay)',
        // Collapse heavier shadows to overlay
        'lg': 'var(--shadow-overlay)',
        'xl': 'var(--shadow-overlay)',
        '2xl': 'var(--shadow-overlay)',
        // Remove template shadows
        'glass': 'var(--shadow-md)',
        'glass-dark': 'var(--shadow-md)',
        'card': 'var(--shadow-sm)',
        'card-hover': 'var(--shadow-md)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02))',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
