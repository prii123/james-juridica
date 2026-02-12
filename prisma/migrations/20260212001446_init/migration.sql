-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('NATURAL', 'JURIDICA');

-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('NUEVO', 'CONTACTADO', 'CALIFICADO', 'CONVERTIDO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "TipoAsesoria" AS ENUM ('INICIAL', 'SEGUIMIENTO', 'ESPECIALIZADA');

-- CreateEnum
CREATE TYPE "EstadoAsesoria" AS ENUM ('PROGRAMADA', 'REALIZADA', 'CANCELADA', 'REPROGRAMADA');

-- CreateEnum
CREATE TYPE "ModalidadAsesoria" AS ENUM ('PRESENCIAL', 'VIRTUAL', 'TELEFONICA');

-- CreateEnum
CREATE TYPE "ResultadoAsesoria" AS ENUM ('EXITOSA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EstadoConciliacion" AS ENUM ('SOLICITADA', 'PROGRAMADA', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ResultadoConciliacion" AS ENUM ('ACUERDO_TOTAL', 'ACUERDO_PARCIAL', 'SIN_ACUERDO');

-- CreateEnum
CREATE TYPE "EstadoCaso" AS ENUM ('ACTIVO', 'CERRADO', 'SUSPENDIDO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoInsolvencia" AS ENUM ('REORGANIZACION', 'LIQUIDACION_JUDICIAL', 'INSOLVENCIA_PERSONA_NATURAL', 'ACUERDO_REORGANIZACION');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DEMANDA', 'CONTESTACION', 'PODER', 'CEDULA', 'RUT', 'ESTADOS_FINANCIEROS', 'CERTIFICACION_BANCARIA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoActuacion" AS ENUM ('DERECHO_PETICION', 'LEVANTAMIENTO_EMBARGOS', 'RESPUESTA_REQUERIMIENTO', 'MEMORIAL', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoActuacion" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'ENVIADA', 'RESPONDIDA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "TipoAudiencia" AS ENUM ('CONCILIACION', 'ADMISORIA', 'VERIFICACION_CREDITOS', 'CATEGORIA_CREDITOS', 'CONCORDATO', 'OTRA');

-- CreateEnum
CREATE TYPE "EstadoAudiencia" AS ENUM ('PROGRAMADA', 'REALIZADA', 'APLAZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ModalidadAudiencia" AS ENUM ('PRESENCIAL', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "TipoHonorario" AS ENUM ('ASESORIA', 'REPRESENTACION', 'TRAMITE', 'GESTION_COBRANZA');

-- CreateEnum
CREATE TYPE "ModalidadPago" AS ENUM ('CONTADO', 'FINANCIADO');

-- CreateEnum
CREATE TYPE "EstadoHonorario" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoCuota" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('GENERADA', 'ENVIADA', 'PAGADA', 'VENCIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CONSIGNACION', 'CHEQUE', 'TARJETA_CREDITO', 'TARJETA_DEBITO');

-- CreateEnum
CREATE TYPE "EstadoCartera" AS ENUM ('ACTIVA', 'GESTIONANDO', 'RECUPERADA', 'INCOBRABLE');

-- CreateEnum
CREATE TYPE "TipoGestionCobro" AS ENUM ('LLAMADA', 'EMAIL', 'CARTA', 'VISITA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "EstadoAcuerdo" AS ENUM ('ACTIVO', 'CUMPLIDO', 'INCUMPLIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "documento" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "modulo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "empresa" TEXT,
    "tipoPersona" "TipoPersona" NOT NULL DEFAULT 'NATURAL',
    "documento" TEXT,
    "estado" "EstadoLead" NOT NULL DEFAULT 'NUEVO',
    "origen" TEXT,
    "observaciones" TEXT,
    "responsableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fechaSeguimiento" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asesorias" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAsesoria" NOT NULL,
    "estado" "EstadoAsesoria" NOT NULL DEFAULT 'PROGRAMADA',
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER,
    "modalidad" "ModalidadAsesoria" NOT NULL DEFAULT 'PRESENCIAL',
    "tema" TEXT NOT NULL,
    "descripcion" TEXT,
    "notas" TEXT,
    "valor" DECIMAL(10,2),
    "resultado" "ResultadoAsesoria",
    "leadId" TEXT NOT NULL,
    "asesorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asesorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliaciones" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "demandante" TEXT NOT NULL,
    "demandado" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoConciliacion" NOT NULL DEFAULT 'SOLICITADA',
    "resultado" "ResultadoConciliacion",
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAudiencia" TIMESTAMP(3),
    "observaciones" TEXT,
    "asesoriaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conciliaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "tipoPersona" "TipoPersona" NOT NULL DEFAULT 'NATURAL',
    "empresa" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos" (
    "id" TEXT NOT NULL,
    "numeroCaso" TEXT NOT NULL,
    "tipoInsolvencia" "TipoInsolvencia" NOT NULL,
    "estado" "EstadoCaso" NOT NULL DEFAULT 'ACTIVO',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "valorDeuda" DECIMAL(12,2) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "observaciones" TEXT,
    "clienteId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actuaciones" (
    "id" TEXT NOT NULL,
    "tipo" "TipoActuacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoActuacion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaVencimiento" TIMESTAMP(3),
    "fechaRespuesta" TIMESTAMP(3),
    "observaciones" TEXT,
    "archivo" TEXT,
    "casoId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actuaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audiencias" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAudiencia" NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoAudiencia" NOT NULL DEFAULT 'PROGRAMADA',
    "modalidad" "ModalidadAudiencia" NOT NULL DEFAULT 'PRESENCIAL',
    "direccion" TEXT,
    "enlace" TEXT,
    "observaciones" TEXT,
    "resultado" TEXT,
    "casoId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audiencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "descripcion" TEXT,
    "archivo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "extension" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "honorarios" (
    "id" TEXT NOT NULL,
    "tipo" "TipoHonorario" NOT NULL,
    "modalidadPago" "ModalidadPago" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoHonorario" NOT NULL DEFAULT 'PENDIENTE',
    "fechaVencimiento" TIMESTAMP(3),
    "fechaPago" TIMESTAMP(3),
    "observaciones" TEXT,
    "numeroCuotas" INTEGER,
    "valorCuota" DECIMAL(10,2),
    "casoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "honorarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuotas_honorarios" (
    "id" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "estado" "EstadoCuota" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "honorarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuotas_honorarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'GENERADA',
    "observaciones" TEXT,
    "honorarioId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_factura" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "facturaId" TEXT NOT NULL,

    CONSTRAINT "items_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartera" (
    "id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "diasVencido" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoCartera" NOT NULL DEFAULT 'ACTIVA',
    "observaciones" TEXT,
    "honorarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cartera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestiones_cobro" (
    "id" TEXT NOT NULL,
    "tipo" "TipoGestionCobro" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "resultado" TEXT,
    "proximaGestion" TIMESTAMP(3),
    "carteraId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gestiones_cobro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "facturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acuerdos_pago" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "numeroCuotas" INTEGER NOT NULL,
    "valorCuota" DECIMAL(10,2) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoAcuerdo" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "deudorNombre" TEXT NOT NULL,
    "deudorDocumento" TEXT NOT NULL,
    "deudorEmail" TEXT,
    "deudorTelefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acuerdos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuotas_acuerdo" (
    "id" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "estado" "EstadoCuota" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "acuerdoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuotas_acuerdo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_documento_key" ON "users"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_nombre_key" ON "permissions"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "conciliaciones_numero_key" ON "conciliaciones"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "casos_numeroCaso_key" ON "casos"("numeroCaso");

-- CreateIndex
CREATE UNIQUE INDEX "casos_clienteId_tipoInsolvencia_estado_key" ON "casos"("clienteId", "tipoInsolvencia", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_key" ON "facturas"("numero");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesorias" ADD CONSTRAINT "asesorias_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesorias" ADD CONSTRAINT "asesorias_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones" ADD CONSTRAINT "conciliaciones_asesoriaId_fkey" FOREIGN KEY ("asesoriaId") REFERENCES "asesorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuaciones" ADD CONSTRAINT "actuaciones_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuaciones" ADD CONSTRAINT "actuaciones_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audiencias" ADD CONSTRAINT "audiencias_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audiencias" ADD CONSTRAINT "audiencias_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honorarios" ADD CONSTRAINT "honorarios_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas_honorarios" ADD CONSTRAINT "cuotas_honorarios_honorarioId_fkey" FOREIGN KEY ("honorarioId") REFERENCES "honorarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_honorarioId_fkey" FOREIGN KEY ("honorarioId") REFERENCES "honorarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_factura" ADD CONSTRAINT "items_factura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartera" ADD CONSTRAINT "cartera_honorarioId_fkey" FOREIGN KEY ("honorarioId") REFERENCES "honorarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestiones_cobro" ADD CONSTRAINT "gestiones_cobro_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "cartera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestiones_cobro" ADD CONSTRAINT "gestiones_cobro_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas_acuerdo" ADD CONSTRAINT "cuotas_acuerdo_acuerdoId_fkey" FOREIGN KEY ("acuerdoId") REFERENCES "acuerdos_pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;
