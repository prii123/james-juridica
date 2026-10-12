-- Catálogo de productos y servicios para facturar.
CREATE TYPE "TipoProducto" AS ENUM ('PRODUCTO', 'SERVICIO');

CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProducto" NOT NULL DEFAULT 'SERVICIO',
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- Item de factura: producto del catálogo del que salió (opcional).
ALTER TABLE "items_factura" ADD COLUMN "productoId" TEXT;

ALTER TABLE "items_factura" ADD CONSTRAINT "items_factura_productoId_fkey"
  FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
