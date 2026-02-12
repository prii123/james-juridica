# ERP Jurídico - Procesos de Insolvencia

Sistema de gestión integral para procesos de insolvencia en Colombia, desarrollado con Next.js 14, TypeScript y Prisma.

## 🚀 Características

### Módulos Principales
- **Dashboard**: Resumen ejecutivo y métricas principales
- **Leads**: Gestión de prospectos comerciales
- **Asesorías**: Manejo de consultas jurídicas
- **Conciliaciones**: Procesos de conciliación
- **Casos Jurídicos**: Gestión completa de procesos de insolvencia
- **Actuaciones**: Seguimiento de actuaciones legales
- **Audiencias**: Programación y seguimiento de audiencias
- **Honorarios**: Control de honorarios y pagos
- **Facturación**: Generación de facturas y control de ingresos
- **Cartera**: Gestión de cuentas por cobrar
- **Usuarios**: Administración de usuarios, roles y permisos

### Funcionalidades Técnicas
- ✅ Autenticación y autorización con NextAuth.js
- ✅ Sistema de roles y permisos granular
- ✅ API REST con validación de datos (Zod)
- ✅ Base de datos PostgreSQL con Prisma ORM
- ✅ Arquitectura modular (Repository/Service pattern)
- ✅ Tipos de insolvencia colombiana
- ✅ Workflows automatizados
- ✅ Sistema de facturación integrado

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: NextAuth.js
- **Validación**: Zod
- **UI Components**: Radix UI
- **Estado**: Tanstack Query

## 🚦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar base de datos
1. Crear una base de datos PostgreSQL llamada `juridica_insolvencia`
2. Copiar `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

3. Editar `.env.local` con tu configuración:
```bash
DATABASE_URL="postgresql://usuario:password@localhost:5432/juridica_insolvencia?schema=public"
NEXTAUTH_SECRET="tu-secret-key-muy-segura-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Configurar Prisma
```bash
# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar base de datos con datos iniciales
npm run db:seed
```

### 4. Ejecutar el proyecto
```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000)

## 👥 Usuarios de Prueba

Después de ejecutar el seed, tendrás estos usuarios disponibles:

| Email | Contraseña | Rol | Permisos |
|-------|------------|-----|----------|
| admin@juridica.com | admin123 | Administrador | Todos |
| abogado@juridica.com | abogado123 | Abogado | Casos, Actuaciones, Audiencias |
| asesor@juridica.com | asesor123 | Asesor | Leads, Asesorías |

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── leads/             # Gestión de leads
│   ├── casos/             # Gestión de casos
│   ├── asesorias/         # Gestión de asesorías
│   └── ...                # Otros módulos
├── lib/                   # Core del sistema
│   ├── auth.ts           # Configuración NextAuth
│   ├── db.ts             # Cliente Prisma
│   ├── permissions.ts    # Sistema de permisos
│   ├── workflows.ts      # Workflows de insolvencia
│   ├── billing.ts        # Sistema de facturación
│   └── utils.ts          # Utilidades
├── modules/               # Módulos de negocio
│   ├── leads/            # Lógica de leads
│   ├── casos/            # Lógica de casos
│   └── ...               # Otros módulos
└── types/                # Definiciones de tipos TypeScript

prisma/
├── schema.prisma         # Esquema de base de datos
└── seed.ts              # Datos iniciales
```

### Arquitectura de Módulos

Cada módulo sigue el patrón Repository/Service:

```
modules/[modulo]/
├── types.ts             # Interfaces y tipos TypeScript
├── validators.ts        # Validaciones con Zod
├── repository.ts        # Acceso a datos (Prisma)
└── services.ts          # Lógica de negocio
```

## 🗄️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Push de esquema (desarrollo)
npm run db:migrate       # Crear migración
npm run db:seed          # Poblar base de datos
npm run db:studio        # Abrir Prisma Studio
npm run db:reset         # Resetear base de datos

# Código
npm run lint             # Linter ESLint
```

## 🔒 Sistema de Permisos

El sistema implementa un control de acceso granular basado en roles:

- **dashboard.view**: Ver dashboard
- **leads.view/create/edit/delete**: Gestión de leads
- **casos.view/create/edit/delete**: Gestión de casos
- **actuaciones.view/create/edit**: Gestión de actuaciones
- **usuarios.view/create/edit/delete**: Gestión de usuarios
- **roles.manage**: Gestión de roles y permisos

## 📋 Tipos de Insolvencia Soportados

El sistema maneja los procesos de insolvencia según la normativa colombiana:

1. **Reorganización Empresarial**
2. **Liquidación Judicial**
3. **Insolvencia Persona Natural**
4. **Acuerdo de Reorganización**

---

**Desarrollado con ❤️ para la gestión eficiente de procesos de insolvencia en Colombia**
