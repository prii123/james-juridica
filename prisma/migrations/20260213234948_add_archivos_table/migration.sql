-- CreateTable
CREATE TABLE "archivos" (
    "id" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
