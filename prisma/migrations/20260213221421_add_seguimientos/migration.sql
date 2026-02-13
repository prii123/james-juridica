-- CreateEnum
CREATE TYPE "TipoSeguimiento" AS ENUM ('LLAMADA', 'EMAIL', 'REUNION', 'NOTA', 'WHATSAPP');

-- CreateTable
CREATE TABLE "seguimientos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoSeguimiento" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duracion" INTEGER,
    "resultado" TEXT,
    "proximoSeguimiento" TIMESTAMP(3),
    "leadId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimientos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
