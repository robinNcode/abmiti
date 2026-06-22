/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        bengali: ['"Noto Sans Bengali"', 'sans-serif'],
      },
      colors: {
        terra:   { DEFAULT: '#c2552a', light: '#e8855e', dark: '#9a3d1a' },
        mustard: { DEFAULT: '#d4973e', light: '#f0c878', dark: '#a97520' },
        sage:    { DEFAULT: '#4a7c59', light: '#7eb992', dark: '#2f5239' },
        ink:     { DEFAULT: '#1a1208', muted: '#5a4e3a' },
        paper:   { DEFAULT: '#fdf6ec', mist: '#f0e8d8', mist2: '#e8dcc8' },
        bkash:   '#e2136e',
        nagad:   '#f06922',
      },
      boxShadow: {
        card: '0 2px 20px rgba(26,18,8,0.10)',
        lift: '0 8px 32px rgba(26,18,8,0.14)',
      },
      borderRadius: { xl2: '1rem', xl3: '1.25rem' },
      animation: {
        'fade-up':   'fadeUp 0.35s ease both',
        'fade-in':   'fadeIn 0.25s ease both',
        'slide-in':  'slideIn 0.3s ease both',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
