/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic Theme Tokens backed by CSS variables
        page: 'var(--bg-page)',
        'bg-page': 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        'bg-surface': 'var(--bg-surface)',
        'surface-elevated': 'var(--bg-elevated)',
        'bg-surface-elevated': 'var(--bg-elevated)',
        'surface-hover': 'var(--bg-elevated-hover)',
        'surface-active': 'var(--bg-active)',

        // Typography Colors (both primary and text-primary resolve properly)
        primary: 'var(--text-primary)',
        'text-primary': 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        'text-secondary': 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        'text-muted': 'var(--text-muted)',
        disabled: 'var(--text-disabled)',
        'text-disabled': 'var(--text-disabled)',

        // Borders
        border: 'var(--border-subtle)',
        'border-subtle': 'var(--border-subtle)',
        'border-border': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',

        // Accent (Saffron)
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          border: 'var(--accent-border)',
          text: 'var(--accent-text)',
          dark: 'var(--accent-hover)',
        },
        'accent-dark': 'var(--accent-hover)',
        'text-accent': 'var(--accent)',
        'text-accent-dark': 'var(--accent-hover)',

        // Semantic Status Tokens
        danger: {
          DEFAULT: 'var(--danger)',
          subtle: 'var(--danger-subtle)',
          border: 'var(--danger-border)',
          text: 'var(--danger-text)',
        },
        success: {
          DEFAULT: 'var(--success)',
          subtle: 'var(--success-subtle)',
          border: 'var(--success-border)',
          text: 'var(--success-text)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          subtle: 'var(--warning-subtle)',
          border: 'var(--warning-border)',
          text: 'var(--warning-text)',
        },

        // Palette references for explicit needs
        brand: {
          silver: '#C7CBD1',
          'light-silver': '#E9ECEF',
          saffron: '#F4B942',
          'dark-saffron': '#D99418',
          black: '#0B0D0F',
          surface: '#14171A',
          elevation: '#1B1F24',
          'light-text': '#17191C',
          'dark-text': '#F5F7FA',
          muted: '#7C858F',
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          'Menlo',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }], // 11px
        xs: ['0.75rem', { lineHeight: '1rem' }],           // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],       // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],          // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],       // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],        // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],         // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],    // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],      // 36px
        '5xl': ['3rem', { lineHeight: '1.15' }],           // 48px
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',   // 4px
        DEFAULT: '0.375rem', // 6px
        md: '0.5rem',    // 8px
        lg: '0.75rem',   // 12px
        xl: '1rem',      // 16px
        '2xl': '1.25rem',// 20px
        pill: '9999px',
      },
      boxShadow: {
        none: 'none',
        subtle: 'var(--shadow-subtle)',
        medium: 'var(--shadow-medium)',
        elevated: 'var(--shadow-elevated)',
        modal: 'var(--shadow-modal)',
        pill: '0 12px 24px -6px rgba(15, 23, 42, 0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
