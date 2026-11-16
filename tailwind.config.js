/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F3',
        card: '#FFFFFF',
        ink: '#1F2421',
        muted: '#555D58',
        line: '#E3DED2',
        accent: { DEFAULT: '#2F5D50', soft: '#E6EEEB', ink: '#23473D' },
        dev: { bg: '#13171A', panel: '#1B2125', line: '#2E373D', text: '#D5DED8', dim: '#9AA8A0', amber: '#F2B84B', cyan: '#7FD1C7', red: '#F28B82' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
