/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // KarigarCo. brand palette
        forest: {
          50: '#f0f7ec',
          100: '#d8edd0',
          200: '#b3d9a3',
          300: '#85be6d',
          400: '#5ea440',
          500: '#3d7a28',
          600: '#2d5016', // primary brand green
          700: '#254213',
          800: '#1c340f',
          900: '#12230a',
        },
        gold: {
          50: '#fdf9ec',
          100: '#faefd0',
          200: '#f4dc9a',
          300: '#eec45a',
          400: '#d4a853', // brand gold
          500: '#c0892a',
          600: '#9d6b1c',
          700: '#7d5218',
          800: '#5f3c12',
          900: '#40270c',
        },
        terracotta: {
          50: '#fdf1ee',
          100: '#faded7',
          200: '#f4b8a9',
          300: '#e88d76',
          400: '#d6634a',
          500: '#c04030',
          600: '#9b3225',
          700: '#7a271d',
          800: '#5c1d16',
          900: '#3c130d',
        },
        cream: {
          50: '#fdfaf5',
          100: '#faf4e8',
          200: '#f4e9d0',
          300: '#ecdab3',
          400: '#e0c888',
          500: '#d4b55d',
        },
        earth: {
          50: '#f5f0ea',
          100: '#e8ddd0',
          200: '#ceb89f',
          300: '#b08d6e',
          400: '#8d6945',
          500: '#6b4f30',
          600: '#4a3520',
          700: '#2f2213',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
