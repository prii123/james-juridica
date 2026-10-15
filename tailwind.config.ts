import type { Config } from 'tailwindcss'

// Migración de Bootstrap a Tailwind en curso (ver src/app/globals.css).
// Mientras conviven ambos frameworks, `preflight` queda desactivado para no
// romper el estilado de las páginas que aún no se han migrado.
// Cuando todo el proyecto use Tailwind: quitar `corePlugins.preflight: false`,
// quitar el import de bootstrap.min.css y el <Script> de bootstrap.bundle.min.js
// en src/app/layout.tsx, y desinstalar la dependencia `bootstrap`.
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // Paleta de marca del ERP Jurídico, tomada de los colores que ya se
        // usaban con Bootstrap (en su mayoría coinciden con slate/blue/teal
        // de Tailwind, así que también pueden usarse directamente esos).
        brand: {
          black: '#000000',
          navy: '#08265A', // azul marino de la paleta
          white: '#FFFFFF',
          sidebar: '#030b1a',
          sidebarDark: '#000000',
          sidebarBorder: '#15294d',
          primary: '#08265A',
          info: '#0369a1', // sky-700
          success: '#0f766e', // teal-700
          danger: '#dc2626', // red-600
        },
        // Paleta de marca (negro → azul marino → blanco). El proyecto ya usa blue-800 como color
        // primario y slate para fondos y textos, así que se redefinen estas dos escalas y toda la
        // interfaz adopta la paleta sin tocar cada componente. blue-800 = #08265A (azul marino).
        blue: {
          50: '#f1f5fb',
          100: '#e1e9f6',
          200: '#c3d3ec',
          300: '#93aedb',
          400: '#5f84c4',
          500: '#3a62a8',
          600: '#254c8f',
          700: '#153a73',
          800: '#08265a',
          900: '#061c42',
          950: '#030f26',
        },
        // Grises con un leve tinte azul marino, para que fondos y textos combinen con la paleta.
        slate: {
          50: '#f6f8fb',
          100: '#eceff5',
          200: '#dde2ec',
          300: '#c3cad9',
          400: '#8e98af',
          500: '#66718b',
          600: '#4a546b',
          700: '#343c50',
          800: '#1a2133',
          900: '#0a0f1c',
          950: '#04070d',
        },
      },
      // Degradados de la paleta: negro → marino (barra lateral) y blanco → marino.
      backgroundImage: {
        'brand-dark': 'linear-gradient(180deg, #000000 0%, #08265A 100%)',
        'brand-dark-x': 'linear-gradient(90deg, #000000 0%, #08265A 100%)',
        'brand-light': 'linear-gradient(90deg, #FFFFFF 0%, #08265A 100%)',
      },
      // Sombras suaves y difusas (estilo SaaS moderno) en vez de las sombras
      // duras por defecto de Tailwind. Usadas por Card, Modal, dropdowns, etc.
      boxShadow: {
        soft: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'soft-md': '0 4px 8px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        'soft-lg': '0 12px 24px -6px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.06)',
        'soft-xl': '0 24px 48px -12px rgb(15 23 42 / 0.16), 0 8px 16px -8px rgb(15 23 42 / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
