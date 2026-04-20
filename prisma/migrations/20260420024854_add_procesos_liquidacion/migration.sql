-- CreateTable
CREATE TABLE "procesos_liquidacion" (
    "id" TEXT NOT NULL,
    "audienciaId" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "pasos" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procesos_liquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "procesos_liquidacion_audienciaId_key" ON "procesos_liquidacion"("audienciaId");

-- AddForeignKey
ALTER TABLE "procesos_liquidacion" ADD CONSTRAINT "procesos_liquidacion_audienciaId_fkey" FOREIGN KEY ("audienciaId") REFERENCES "audiencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos_liquidacion" ADD CONSTRAINT "procesos_liquidacion_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
