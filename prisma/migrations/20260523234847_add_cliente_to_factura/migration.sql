-- AlterTable
ALTER TABLE "facturas" ADD COLUMN     "clienteId" TEXT,
ADD COLUMN     "clienteNombre" TEXT;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
