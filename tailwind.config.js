/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0E172B',
          DEFAULT: '#14213D',
          800: '#1B2C52',
          700: '#233766',
        },
        indigo: {
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
          light: '#EEF2FF',
          muted: '#818CF8',
        },
        ivory: {
          DEFAULT: '#F8F7F4',
          subtle: '#F2EFEB',
          warm: '#EFECE6',
        },
        champagne: {
          DEFAULT: '#C6AA80',
          dark: '#B08F5D',
          light: '#EADEC9',
          pale: '#F7F3EC',
        },
        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(20, 33, 61, 0.05), 0 1px 2px rgba(20, 33, 61, 0.08)',
        'card': '0 4px 12px -2px rgba(20, 33, 61, 0.08), 0 2px 6px -1px rgba(20, 33, 61, 0.04)',
        'premium': '0 12px 32px -4px rgba(20, 33, 61, 0.12), 0 4px 16px -2px rgba(20, 33, 61, 0.06)',
        'float': '0 20px 40px -8px rgba(20, 33, 61, 0.16)',
      }
    },
  },
  plugins: [],
}
