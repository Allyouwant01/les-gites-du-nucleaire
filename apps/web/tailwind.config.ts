import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4F72',
          light: '#2E86C1',
          dark: '#154360',
        },
        accent: {
          DEFAULT: '#F4D03F',
          dark: '#D4AC0D',
        },
        gray: {
          50: '#F8F9FA',
          100: '#F8F9FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        search: '20px',
        badge: '16px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.08)',
        elevated: '0 4px 20px rgba(0,0,0,0.12)',
        button: '0 2px 8px rgba(0,0,0,0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
