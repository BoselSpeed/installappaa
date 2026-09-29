/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Surfaces
        paper: '#FFFFFF',
        surface: '#F5F5F5',
        'surface-quiet': '#FAFAFA',
        line: '#E0E0E0',
        // Ink scale — text, borders and icons
        ink: '#000000',
        'ink-soft': '#1A1A1A',
        'ink-body': '#333333',
        'ink-muted': '#666666',
        'ink-faint': '#808080',
        'ink-ghost': '#A9A9A9',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.6' }],
        sm: ['0.875rem', { lineHeight: '1.6' }],
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        xl: ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '4xl': ['2.25rem', { lineHeight: '1.25' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
      },
      boxShadow: {
        // Soft, low-opacity shadows only — never hard #000000 shadows
        card: '0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.10)',
        'card-raised': '0 8px 24px rgba(0, 0, 0, 0.12)',
        pop: '0 12px 32px rgba(0, 0, 0, 0.15)',
        none: 'none',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      transitionProperty: {
        card: 'box-shadow, border-color, background-color, color, opacity, transform',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Amiri', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
}
