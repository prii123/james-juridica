-- Radicacion pasa de guardar "demandante"/"demandado"/"valor" como texto libre a relacionarse
-- con un Cliente real. clienteId queda nullable (ver comentario en schema.prisma): así la
-- migración nunca falla por datos existentes que no se puedan resolver automáticamente.

-- AlterTable: agregar la columna primero, sin NOT NULL.
ALTER TABLE "radicaciones" ADD COLUMN "clienteId" TEXT;

-- Backfill: para las radicaciones que nacieron de una asesoría, el cliente es el que ya se
-- haya creado con el email de ese lead (por ejemplo, al aceptar la radicación se crea el cliente
-- en ese momento; si el lead ya se calificó, el cliente también pudo crearse desde ahí).
UPDATE "radicaciones" r
SET "clienteId" = c.id
FROM "asesorias" a
JOIN "leads" l ON l.id = a."leadId"
JOIN "clientes" c ON c.email = l.email
WHERE r."asesoriaId" = a.id
  AND r."clienteId" IS NULL;

-- Las radicaciones creadas directamente (sin asesoría) o cuyo lead nunca generó un cliente
-- quedan con clienteId NULL; alguien deberá asignarles un cliente manualmente desde el ERP.

-- AddForeignKey
ALTER TABLE "radicaciones" ADD CONSTRAINT "radicaciones_clienteId_fkey"
  FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropColumn
ALTER TABLE "radicaciones" DROP COLUMN "demandante";
ALTER TABLE "radicaciones" DROP COLUMN "demandado";
ALTER TABLE "radicaciones" DROP COLUMN "valor";
