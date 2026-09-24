-- Se elimina el estado CONVERTIDO de los leads. Los leads convertidos pasan a CALIFICADO:
-- que un lead se convirtió se deduce de que tenga asesorías asociadas.
-- El UPDATE va antes de cambiar el tipo; si no, el cast fallaría con las filas existentes.
UPDATE "leads" SET "estado" = 'CALIFICADO' WHERE "estado" = 'CONVERTIDO';

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoLead_new" AS ENUM ('NUEVO', 'CONTACTADO', 'CALIFICADO', 'PERDIDO');
ALTER TABLE "leads" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "estado" TYPE "EstadoLead_new" USING ("estado"::text::"EstadoLead_new");
ALTER TYPE "EstadoLead" RENAME TO "EstadoLead_old";
ALTER TYPE "EstadoLead_new" RENAME TO "EstadoLead";
DROP TYPE "EstadoLead_old";
ALTER TABLE "leads" ALTER COLUMN "estado" SET DEFAULT 'NUEVO';
COMMIT;
