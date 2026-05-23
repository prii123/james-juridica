-- DropForeignKey
ALTER TABLE "facturas" DROP CONSTRAINT "facturas_honorarioId_fkey";

-- DropForeignKey
ALTER TABLE "honorarios" DROP CONSTRAINT "honorarios_casoId_fkey";

-- DropForeignKey
ALTER TABLE "radicaciones" DROP CONSTRAINT "radicaciones_asesoriaId_fkey";

-- DropIndex
DROP INDEX "casos_clienteId_tipoInsolvencia_estado_key";

-- AlterTable
ALTER TABLE "facturas" ALTER COLUMN "honorarioId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "honorarios" ALTER COLUMN "casoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "radicaciones" ALTER COLUMN "asesoriaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "radicaciones" ADD CONSTRAINT "radicaciones_asesoriaId_fkey" FOREIGN KEY ("asesoriaId") REFERENCES "asesorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honorarios" ADD CONSTRAINT "honorarios_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_honorarioId_fkey" FOREIGN KEY ("honorarioId") REFERENCES "honorarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
