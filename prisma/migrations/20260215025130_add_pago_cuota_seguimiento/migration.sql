/*
  Warnings:

  - Added the required column `saldoCuota` to the `cuotas_factura` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "EstadoCuota" ADD VALUE 'PARCIAL';

-- AlterTable
ALTER TABLE "cuotas_factura" ADD COLUMN     "saldoCuota" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "valorPagado" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "pagos_cuotas" (
    "id" TEXT NOT NULL,
    "valorAplicado" DECIMAL(10,2) NOT NULL,
    "fechaAplicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "pagoId" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_cuotas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pagos_cuotas" ADD CONSTRAINT "pagos_cuotas_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "pagos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuotas" ADD CONSTRAINT "pagos_cuotas_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "cuotas_factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;
