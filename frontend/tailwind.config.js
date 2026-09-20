/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        'bg-deep': '#0f2a2e',
        'market-slate': '#305050',
        mist: '#b6bcc5',
        copper: '#bc7363',
        'copper-deep': '#895c47',
        paper: '#ece8e4',
        status: {
          paid: '#5fb49c',
          'due-soon': '#d9a45b',
          overdue: '#d9604f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Montserrat', 'Poppins', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'copper-glow': '0 0 24px -2px rgba(188, 115, 99, 0.4)',
        'teal-glow': '0 0 24px -2px rgba(15, 42, 46, 0.5)',
      },
      borderRadius: {
        'panel': '20px',
        'btn': '22px',
      }
    },
  },
  plugins: [],
}

