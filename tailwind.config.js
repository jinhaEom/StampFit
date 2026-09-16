/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // src/constants/theme.ts 의 Colors 와 동기화해서 관리한다
      colors: {
        bg: '#0E0F11',
        card: '#181A1D',
        'card-sel': '#2E3135',
        line: '#26282C',
        fg: '#ECECEC',
        sub: '#8A8C91',
        dim: '#6E7075',
        accent: '#4FD1B3', // 민트
        'on-accent': '#111214',
        danger: '#E5484D',
      },
    },
  },
  plugins: [],
};
