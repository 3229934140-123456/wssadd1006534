/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E8F0FE',
          100: '#D2E3FC',
          200: '#A8C9F8',
          300: '#7EAEF5',
          400: '#5494F1',
          500: '#1A73E8',
          600: '#1557B0',
          700: '#0D47A1',
          800: '#083375',
          900: '#041E48',
        },
        secondary: {
          50: '#E8F5EC',
          100: '#D1ECD8',
          200: '#A3D9B1',
          300: '#75C68A',
          400: '#47B363',
          500: '#34A853',
          600: '#2A8642',
          700: '#1F6532',
          800: '#154321',
          900: '#0A2211',
        },
        accent: {
          mint: '#7FD29E',
          coral: '#FB7185',
          yellow: '#FBBC04',
          purple: '#9C27B0',
          cyan: '#00BCD4',
        }
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.12)',
        'button': '0 4px 12px rgba(26, 115, 232, 0.3)',
        'button-hover': '0 6px 20px rgba(26, 115, 232, 0.4)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
