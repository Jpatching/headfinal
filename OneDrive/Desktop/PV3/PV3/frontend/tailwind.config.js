/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'audiowide': ['Audiowide', 'cursive'],
        'satoshi': ['Satoshi', 'sans-serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      colors: {
        // PV3 Gaming Color Palette
        'bg-main': '#0F0F0F',
        'bg-elevated': '#1A1A1A', 
        'bg-card': '#1A1A1A',
        'bg-hover': '#252525',
        'border': '#2B2B2B',
        'text-primary': '#FFFFFF',
        'text-secondary': '#CCCCCC',
        'text-muted': '#999999',
        'accent-primary': '#E6E6E6',
        'accent-secondary': '#9333EA',
        'accent-success': '#10B981',
        'accent-danger': '#EF4444',
        'accent-warning': '#F59E0B',
      },
      fontSize: {
        'heading-sm': ['20px', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-md': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        'body-md': ['16px', { lineHeight: '1.5' }],
        'button': ['14px', { lineHeight: '1', fontWeight: '700' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(230, 230, 230, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(230, 230, 230, 0.4)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
} 