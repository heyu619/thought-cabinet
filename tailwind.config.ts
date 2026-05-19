import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cabinet-bg': '#1a1814',
        'cabinet-bg-secondary': '#252219',
        'cabinet-card': '#2d2a23',
        'cabinet-text': '#d4c5a3',
        'cabinet-text-secondary': '#8b8070',
        'cabinet-accent': '#c9a227',
        'cabinet-warn': '#a34a28',
        'cabinet-skill': '#5a8f7b',
      },
      fontFamily: {
        'typewriter': ['var(--font-special-elite)', 'monospace'],
        'mono': ['var(--font-ibm-plex-mono)', 'monospace'],
        'serif': ['var(--font-noto-serif)', 'serif'],
      },
      animation: {
        'typewriter': 'typewriter 3s steps(40) 1s forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(201, 162, 39, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(201, 162, 39, 0.6)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
