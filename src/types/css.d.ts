// Permite importar hojas de estilo "de efecto" (por ejemplo `import './globals.css'` en el layout).
// Next las procesa al compilar, pero las versiones recientes de TypeScript piden que el módulo
// esté declarado (error TS2882) y Next 14 no trae esta declaración.
declare module '*.css'
