module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0E0F11',
        cardBackground: '#181A1D',
        cardSelected: '#2E3135',
        border: '#26282C',
        mainText: '#ECECEC',
        subText1: '#8A8C91',
        subText2: '#6E7075',
        disabledText: '#4a4c4fff',
        main: '#4FD1B3', // 민트
        textOnMain: '#111214',
        danger: '#E5484D',
      },
    },
  },
  plugins: [],
};
