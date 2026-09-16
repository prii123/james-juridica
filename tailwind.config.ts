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
    },
  },
  plugins: [],
}
export default config
