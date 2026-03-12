-- Renombrar tipos enum (preservando datos)-- 1. Renombrar EstadoConciliacion a EstadoRadicacion
ALTER TYPE "EstadoConciliacion" RENAME TO "EstadoRadicacion";

-- 2. Renombrar ResultadoConciliacion a ResultadoRadicacion
ALTER TYPE "ResultadoConciliacion" RENAME TO "ResultadoRadicacion";

-- 3. Actualizar valor en enum TipoAudiencia
ALTER TYPE "TipoAudiencia" RENAME VALUE 'CONCILIACION' TO 'RADICACION';

-- 4. Renombrar tabla conciliaciones a radicaciones
ALTER TABLE "conciliaciones" RENAME TO "radicaciones";

-- 5. Renombrar constraints
ALTER TABLE "radicaciones" RENAME CONSTRAINT "conciliaciones_pkey" TO "radicaciones_pkey";
ALTER TABLE "radicaciones" RENAME CONSTRAINT "conciliaciones_asesoriaId_fkey" TO "radicaciones_asesoriaId_fkey";

-- 6. Renombrar índices
ALTER INDEX "conciliaciones_numero_key" RENAME TO "radicaciones_numero_key";
