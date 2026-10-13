-- La tabla comprobantes_pago ya existe en la base (la creó el chatbot de WhatsApp). Esta migración
-- solo documenta su definición para el esquema de Prisma, y es idempotente: en la base actual
-- no cambia nada; en una base nueva la crea.
DO $$ BEGIN
  CREATE TYPE "EstadoComprobante" AS ENUM ('PENDIENTE_REVISION', 'APROBADO', 'RECHAZADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "comprobantes_pago" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "facturaId" TEXT,
    "telefono" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "nombreOriginal" TEXT,
    "tipoMime" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "estado" "EstadoComprobante" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comprobantes_pago_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "comprobantes_pago_waMessageId_key" ON "comprobantes_pago"("waMessageId");
CREATE INDEX IF NOT EXISTS "comprobantes_pago_clienteId_idx" ON "comprobantes_pago"("clienteId");
CREATE INDEX IF NOT EXISTS "comprobantes_pago_estado_idx" ON "comprobantes_pago"("estado");

DO $$ BEGIN
  ALTER TABLE "comprobantes_pago" ADD CONSTRAINT "comprobantes_pago_facturaId_fkey"
    FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
