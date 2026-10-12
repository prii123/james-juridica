-- Se elimina el módulo de honorarios: la facturación ahora se hace con items (productos y
-- servicios), así que honorarios y cuotas_honorarios dejan de usarse.

-- 1) Las facturas que solo conocían a su cliente y caso a través del honorario los conservan:
--    se copian a facturas.clienteId y facturas.casoId antes de borrar el vínculo.
UPDATE "facturas" f
SET "clienteId" = c."clienteId"
FROM "honorarios" h
JOIN "casos" c ON c."id" = h."casoId"
WHERE f."honorarioId" = h."id" AND f."clienteId" IS NULL;

UPDATE "facturas" f
SET "casoId" = h."casoId"
FROM "honorarios" h
WHERE f."honorarioId" = h."id" AND f."casoId" IS NULL AND h."casoId" IS NOT NULL;

-- 2) Se quitan las referencias al honorario (las llaves foráneas se eliminan con la columna).
ALTER TABLE "facturas" DROP COLUMN "honorarioId";
ALTER TABLE "cartera" DROP COLUMN "honorarioId";

-- 3) Se borran las tablas y los tipos que solo usaban los honorarios.
DROP TABLE "cuotas_honorarios";
DROP TABLE "honorarios";
DROP TYPE "TipoHonorario";
DROP TYPE "EstadoHonorario";
