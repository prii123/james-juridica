-- CreateEnum
CREATE TYPE "ResultadoAudiencia" AS ENUM ('CONCILIACION', 'FRACASO', 'OTRA_AUDIENCIA', 'PENDIENTE');

-- AlterEnum
ALTER TYPE "EstadoAsesoria" ADD VALUE 'PENDIENTE';

-- AlterEnum
ALTER TYPE "ModalidadAudiencia" ADD VALUE 'MIXTA';

-- AlterTable
ALTER TABLE "audiencias" ADD COLUMN     "resultadoAudiencia" "ResultadoAudiencia" NOT NULL DEFAULT 'PENDIENTE';
