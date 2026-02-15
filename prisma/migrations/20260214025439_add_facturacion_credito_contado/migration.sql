-- DropForeignKey
ALTER TABLE "cartera" DROP CONSTRAINT "cartera_honorarioId_fkey";

-- AlterTable
ALTER TABLE "cartera" ADD COLUMN     "facturaId" TEXT,
ALTER COLUMN "honorarioId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "facturas" ADD COLUMN     "modalidadPago" "ModalidadPago" NOT NULL DEFAULT 'CONTADO',
ADD COLUMN     "numeroCuotas" INTEGER,
ADD COLUMN     "tasaInteres" DECIMAL(5,4),
ADD COLUMN     "valorCuota" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "cuotas_factura" (
    "id" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "capital" DECIMAL(10,2) NOT NULL,
    "interes" DECIMAL(10,2) NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "estado" "EstadoCuota" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "facturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuotas_factura_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cuotas_factura" ADD CONSTRAINT "cuotas_factura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartera" ADD CONSTRAINT "cartera_honorarioId_fkey" FOREIGN KEY ("honorarioId") REFERENCES "honorarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartera" ADD CONSTRAINT "cartera_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
