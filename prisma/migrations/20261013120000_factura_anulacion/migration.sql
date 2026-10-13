-- Datos de la anulación de una factura: cuándo, quién y por qué.
ALTER TABLE "facturas" ADD COLUMN "anuladaEn" TIMESTAMP(3);
ALTER TABLE "facturas" ADD COLUMN "anuladaPorId" TEXT;
ALTER TABLE "facturas" ADD COLUMN "motivoAnulacion" TEXT;

-- Las que ya estaban anuladas no guardaron la fecha: se toma la última modificación como aproximación.
-- Quién las anuló y el motivo quedan vacíos (no se registraban).
UPDATE "facturas" SET "anuladaEn" = "updatedAt" WHERE "estado" = 'ANULADA' AND "anuladaEn" IS NULL;
