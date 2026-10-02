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
        subText1: '#A3A5AA', // 대비 7:1
        subText2: '#83858A', // 대비 4.7:1
        disabledText: '#64666B', // 대비 3:1 (placeholder·비활성)
        main: '#4FD1B3', // 민트
        textOnMain: '#111214',
        danger: '#E5484D',
      },
    },
  },
  plugins: [],
};
