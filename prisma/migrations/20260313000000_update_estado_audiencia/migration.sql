-- Migración para actualizar el enum EstadoAudiencia
-- Cambiar de: PROGRAMADA, REALIZADA, APLAZADA, CANCELADA
-- A: PROGRAMADA, SUSPENDIDA, REPROGRAMADA, FRACASO, OBJECION

-- Paso 1: Crear un nuevo tipo enum temporal con todos los valores (viejos y nuevos)
CREATE TYPE "EstadoAudiencia_new" AS ENUM ('PROGRAMADA', 'SUSPENDIDA', 'REPROGRAMADA', 'FRACASO', 'OBJECION', 'REALIZADA', 'APLAZADA', 'CANCELADA');

-- Paso 2: Eliminar el default constraint temporalmente
ALTER TABLE "audiencias" ALTER COLUMN "estado" DROP DEFAULT;

-- Paso 3: Alterar la columna para usar el nuevo tipo
ALTER TABLE "audiencias" ALTER COLUMN "estado" TYPE "EstadoAudiencia_new" USING ("estado"::text::"EstadoAudiencia_new");

-- Paso 4: Mapear los valores antiguos a los nuevos
UPDATE "audiencias" SET "estado" = 'REPROGRAMADA' WHERE "estado" = 'APLAZADA';
UPDATE "audiencias" SET "estado" = 'FRACASO' WHERE "estado" = 'CANCELADA';
UPDATE "audiencias" SET "estado" = 'FRACASO' WHERE "estado" = 'REALIZADA';

-- Paso 5: Establecer el nuevo default
ALTER TABLE "audiencias" ALTER COLUMN "estado" SET DEFAULT 'PROGRAMADA';

-- Paso 6: Eliminar el tipo enum antiguo
DROP TYPE "EstadoAudiencia";

-- Paso 7: Renombrar el nuevo tipo al nombre original
ALTER TYPE "EstadoAudiencia_new" RENAME TO "EstadoAudiencia";
