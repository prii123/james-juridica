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
          sidebar: '#1e293b', // slate-800
          sidebarDark: '#0f172a', // slate-900
          sidebarBorder: '#334155', // slate-700
          primary: '#1e40af', // blue-800
          info: '#0369a1', // sky-700
          success: '#0f766e', // teal-700
          danger: '#dc2626', // red-600
        },
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
