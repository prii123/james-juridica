-- Caso.facturado: 0 = sin facturar, 1 = ya se generó una factura para ese caso.
-- Se agrega con DEFAULT 0 para que las filas existentes queden sin facturar sin necesidad de
-- backfill: es el estado correcto por defecto (no se sabe cuáles ya se facturaron antes de esto).
ALTER TABLE "casos" ADD COLUMN "facturado" INTEGER NOT NULL DEFAULT 0;

-- Factura.casoId: permite facturar un caso directamente, sin pasar por un Honorario (que es
-- el otro camino que ya existía). Nullable, igual que honorarioId y clienteId en esta tabla.
ALTER TABLE "facturas" ADD COLUMN "casoId" TEXT;

ALTER TABLE "facturas" ADD CONSTRAINT "facturas_casoId_fkey"
  FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
