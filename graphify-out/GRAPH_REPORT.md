# Graph Report - .  (2026-09-21)

## Corpus Check
- 216 files · ~108,632 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1125 nodes · 2285 edges · 60 communities (52 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.8)
- Token cost: 0 input · 73,656 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Repositorio de Casos|Repositorio de Casos]]
- [[_COMMUNITY_Procesos de Liquidacion|Procesos de Liquidacion]]
- [[_COMMUNITY_Modulo Cartera|Modulo Cartera]]
- [[_COMMUNITY_Repositorio de Asesorias|Repositorio de Asesorias]]
- [[_COMMUNITY_Layouts de Modulos|Layouts de Modulos]]
- [[_COMMUNITY_Servicio de Audiencias|Servicio de Audiencias]]
- [[_COMMUNITY_Dependencias del Proyecto|Dependencias del Proyecto]]
- [[_COMMUNITY_Repositorio de Leads|Repositorio de Leads]]
- [[_COMMUNITY_Etapas Comerciales|Etapas Comerciales]]
- [[_COMMUNITY_Documentos y Estados|Documentos y Estados]]
- [[_COMMUNITY_Dependencias de Desarrollo|Dependencias de Desarrollo]]
- [[_COMMUNITY_Documentacion Modulo Asesorias|Documentacion Modulo Asesorias]]
- [[_COMMUNITY_Repositorio de Audiencias|Repositorio de Audiencias]]
- [[_COMMUNITY_Gestion de Usuarios y Roles|Gestion de Usuarios y Roles]]
- [[_COMMUNITY_Integracion Google Calendar|Integracion Google Calendar]]
- [[_COMMUNITY_Layout Raiz de la App|Layout Raiz de la App]]
- [[_COMMUNITY_Repositorio de Usuarios|Repositorio de Usuarios]]
- [[_COMMUNITY_Roles y Utilidades|Roles y Utilidades]]
- [[_COMMUNITY_Plantillas de Email|Plantillas de Email]]
- [[_COMMUNITY_Aplicacion de Pagos|Aplicacion de Pagos]]
- [[_COMMUNITY_Filtros y Navegacion de Asesorias|Filtros y Navegacion de Asesorias]]
- [[_COMMUNITY_Rutas API de Audiencias|Rutas API de Audiencias]]
- [[_COMMUNITY_Configuracion TypeScript|Configuracion TypeScript]]
- [[_COMMUNITY_Rutas API Genericas|Rutas API Genericas]]
- [[_COMMUNITY_Envio de Facturas|Envio de Facturas]]
- [[_COMMUNITY_Detalle de Caso|Detalle de Caso]]
- [[_COMMUNITY_PDF Seguimiento de Cuotas|PDF Seguimiento de Cuotas]]
- [[_COMMUNITY_Calculo de Cuotas|Calculo de Cuotas]]
- [[_COMMUNITY_Rutas API con Parametros|Rutas API con Parametros]]
- [[_COMMUNITY_Facturacion y Comisiones|Facturacion y Comisiones]]
- [[_COMMUNITY_Casos Recientes y Timeline|Casos Recientes y Timeline]]
- [[_COMMUNITY_Calendario de Audiencias|Calendario de Audiencias]]
- [[_COMMUNITY_Rutas API de Consulta|Rutas API de Consulta]]
- [[_COMMUNITY_Timeline de Cuotas|Timeline de Cuotas]]
- [[_COMMUNITY_PDF de Financiacion|PDF de Financiacion]]
- [[_COMMUNITY_Edicion de Audiencias|Edicion de Audiencias]]
- [[_COMMUNITY_Archivos de Leads|Archivos de Leads]]
- [[_COMMUNITY_Pagina de Audiencias|Pagina de Audiencias]]
- [[_COMMUNITY_Honorarios|Honorarios]]
- [[_COMMUNITY_PDF de Facturas|PDF de Facturas]]
- [[_COMMUNITY_Responsables de Caso|Responsables de Caso]]
- [[_COMMUNITY_Actuaciones del Caso|Actuaciones del Caso]]
- [[_COMMUNITY_Detalle de Asesoria|Detalle de Asesoria]]
- [[_COMMUNITY_Listado de Casos|Listado de Casos]]
- [[_COMMUNITY_Resumen de Cuotas|Resumen de Cuotas]]
- [[_COMMUNITY_Nueva Factura|Nueva Factura]]
- [[_COMMUNITY_Componente Alert|Componente Alert]]
- [[_COMMUNITY_Ruta API con Params|Ruta API con Params]]
- [[_COMMUNITY_Seed de Base de Datos|Seed de Base de Datos]]
- [[_COMMUNITY_Cliente Prisma|Cliente Prisma]]
- [[_COMMUNITY_Tipos de NextAuth|Tipos de NextAuth]]
- [[_COMMUNITY_Servicio de Usuarios|Servicio de Usuarios]]
- [[_COMMUNITY_Configuracion de Lanzamiento|Configuracion de Lanzamiento]]
- [[_COMMUNITY_Configuracion ESLint|Configuracion ESLint]]
- [[_COMMUNITY_Configuracion Next.js|Configuracion Next.js]]
- [[_COMMUNITY_Middleware|Middleware]]
- [[_COMMUNITY_Configuracion Tailwind|Configuracion Tailwind]]
- [[_COMMUNITY_Configuracion de Auth|Configuracion de Auth]]

## God Nodes (most connected - your core abstractions)
1. `requirePermission()` - 93 edges
2. `cn()` - 77 edges
3. `Card()` - 55 edges
4. `CardBody()` - 54 edges
5. `CardHeader()` - 51 edges
6. `CardTitle()` - 50 edges
7. `Select` - 36 edges
8. `Input` - 34 edges
9. `authOptions` - 34 edges
10. `Label()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `LeadData` --semantically_similar_to--> `Leads`  [INFERRED] [semantically similar]
  src/modules/asesorias/README.md → README.md
- `GET()` --calls--> `requirePermission()`  [INFERRED]
  src/app/api/audiencias/route.ts → src/lib/permissions.ts
- `GET()` --calls--> `requirePermission()`  [INFERRED]
  src/app/api/bot/stats/route.ts → src/lib/permissions.ts
- `GET()` --calls--> `requirePermission()`  [INFERRED]
  src/app/api/casos/[casoId]/audiencias/route.ts → src/lib/permissions.ts
- `POST()` --calls--> `requirePermission()`  [INFERRED]
  src/app/api/casos/[casoId]/audiencias/route.ts → src/lib/permissions.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Repository/Service Architecture Pattern Across Modules** — readme_repository_service_pattern, asesorias_readme_module, asesorias_readme_repository_service_architecture [INFERRED 0.85]
- **Asesoría Combined Return Shape (Service + Lead + Asesor Data)** — asesorias_readme_asesoriasservice, asesorias_readme_asesordata, asesorias_readme_leaddata [EXTRACTED 1.00]

## Communities (60 total, 8 thin omitted)

### Community 0 - "Repositorio de Casos"
Cohesion: 0.05
Nodes (20): CasosRepository, CasosService, CasoFilters, CasoWithRelations, CreateCasoData, UpdateCasoData, casoFiltersSchema, createCasoSchema (+12 more)

### Community 1 - "Procesos de Liquidacion"
Cohesion: 0.06
Nodes (19): service, ModalProcesosLiquidacion(), ModalProcesosLiquidacionProps, service, service, ProcesosLiquidacionRepository, service, ProcesosLiquidacionService (+11 more)

### Community 2 - "Modulo Cartera"
Cohesion: 0.08
Nodes (27): EstadisticasCartera, FacturaCartera, Props, Asesor, Asesoria, EditarFacturaPage(), EditarLeadPage(), EditAsesoriaData (+19 more)

### Community 3 - "Repositorio de Asesorias"
Cohesion: 0.07
Nodes (14): AsesoriasRepository, AsesoriasService, AsesorData, AsesoriaFilters, AsesoriaWithRelations, CreateAsesoriaData, LeadData, UpdateAsesoriaData (+6 more)

### Community 4 - "Layouts de Modulos"
Cohesion: 0.06
Nodes (12): GET(), GET(), authOptions, handler, handler, handler, roleUpdateSchema, roleCreateSchema (+4 more)

### Community 5 - "Servicio de Audiencias"
Cohesion: 0.07
Nodes (35): audienciasService, DELETE(), PUT(), DELETE(), GET(), PUT(), GET(), PATCH() (+27 more)

### Community 6 - "Dependencias del Proyecto"
Cohesion: 0.05
Nodes (44): dependencies, @auth/prisma-adapter, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, bootstrap, class-variance-authority, clsx (+36 more)

### Community 7 - "Repositorio de Leads"
Cohesion: 0.08
Nodes (11): LeadsRepository, LeadsService, CreateLeadData, LeadFilters, LeadWithRelations, UpdateLeadData, createLeadSchema, leadFiltersSchema (+3 more)

### Community 8 - "Etapas Comerciales"
Cohesion: 0.09
Nodes (27): ETAPA_BY_VALUE, EtapaComercial, etapaInfo(), ETAPAS_COMERCIALES, humanize(), label(), labelList(), labelRangoDinero() (+19 more)

### Community 9 - "Documentos y Estados"
Cohesion: 0.06
Nodes (24): ESTADO_BADGE_VARIANT, Caso, CATEGORIAS_DOCUMENTO, Documento, ESTADO_CONFIG, TIPO_BADGE, TIPO_ICONS, ESTADO_CONFIG (+16 more)

### Community 10 - "Dependencias de Desarrollo"
Cohesion: 0.06
Nodes (33): devDependencies, autoprefixer, eslint, eslint-config-next, postcss, prisma, tailwindcss, tsx (+25 more)

### Community 11 - "Documentacion Modulo Asesorias"
Cohesion: 0.07
Nodes (33): Ejemplo de API Route (GET/POST), AsesorData, AsesoriasService, LeadData, Módulo de Asesorías, Arquitectura de 4 Capas (Types/Validators/Repository/Services), Validaciones del Módulo de Asesorías, Actuaciones (+25 more)

### Community 12 - "Repositorio de Audiencias"
Cohesion: 0.12
Nodes (12): AudienciasRepository, AudienciasService, AudienciaFilters, AudienciaWithRelations, CreateAudienciaData, UpdateAudienciaData, audienciaFiltersSchema, AudienciaFiltersSchemaType (+4 more)

### Community 13 - "Gestion de Usuarios y Roles"
Cohesion: 0.09
Nodes (22): EditUsuarioData, EditUsuarioPage(), Usuario, cn(), Lead, NuevaAsesoriaContent(), CreateRoleData, CreateUsuarioData (+14 more)

### Community 14 - "Integracion Google Calendar"
Cohesion: 0.18
Nodes (9): delay(), getConfig(), GoogleCalendarService, retryWithBackoff(), CalendarSyncEvent, decodeAppEventId(), encodeAppEventId(), GoogleCalendarConfig (+1 more)

### Community 15 - "Layout Raiz de la App"
Cohesion: 0.08
Nodes (14): inter, metadata, AppLayoutProps, authRoutes, MobileSidebar(), ModuleItem, Sidebar(), badgeColorClasses (+6 more)

### Community 16 - "Repositorio de Usuarios"
Cohesion: 0.13
Nodes (10): UsuariosRepository, UsuariosService, CreateUsuarioData, UpdateUsuarioData, UsuarioFilters, UsuarioResponse, UsuarioWithRole, createUsuarioSchema (+2 more)

### Community 17 - "Roles y Utilidades"
Cohesion: 0.08
Nodes (4): EditRoleData, EditRolePage(), Permission, Role

### Community 18 - "Plantillas de Email"
Cohesion: 0.17
Nodes (20): CuotaAmortizacion, CuotaSeguimientoEmail, FacturaEmailData, facturaEmailHTML(), FinanciacionEmailData, financiacionEmailHTML(), formatCurrency(), formatDate() (+12 more)

### Community 19 - "Aplicacion de Pagos"
Cohesion: 0.09
Nodes (18): AplicarPago(), CuotaSeguimiento, DistribucionCuota, Props, METODO_BADGE, PagoHistorial, Props, CuotaSeguimiento (+10 more)

### Community 20 - "Filtros y Navegacion de Asesorias"
Cohesion: 0.10
Nodes (13): AsesoriaFilters, ESTADO_BADGE, BreadcrumbItem, BreadcrumbProps, Caso, CreateAudienciaData, MODALIDADES, NuevaAudienciaPage() (+5 more)

### Community 21 - "Rutas API de Audiencias"
Cohesion: 0.11
Nodes (13): audienciasService, POST(), GET(), GET(), POST(), PERMISSIONS, generateRadicacionNumber(), GET() (+5 more)

### Community 22 - "Configuracion TypeScript"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 23 - "Rutas API Genericas"
Cohesion: 0.15
Nodes (12): GET(), POST(), POST(), GET(), POST(), GET(), POST(), getCurrentUser() (+4 more)

### Community 24 - "Envio de Facturas"
Cohesion: 0.11
Nodes (13): EnviarFacturaModal(), Props, CuotaAmortizacion, ESTADO_CONFIG, FacturaDetailPage(), Lead, NewSeguimientoForm, SeguimientoItem (+5 more)

### Community 25 - "Detalle de Caso"
Cohesion: 0.12
Nodes (11): Caso, ESTADO_CONFIG, PRIORIDAD_CONFIG, TIPO_INSOLVENCIA_LABELS, Permission, Role, User, CardHeader() (+3 more)

### Community 26 - "PDF Seguimiento de Cuotas"
Cohesion: 0.26
Nodes (16): CuotaSeguimientoData, drawCuotaPayments(), drawCuotaRow(), drawCuotasTableHeader(), drawFacturaInfo(), drawFooter(), drawPageHeader(), drawResumen() (+8 more)

### Community 27 - "Calculo de Cuotas"
Cohesion: 0.23
Nodes (10): ensureCuotasGeneradas(), POST(), calcularCuotas(), CuotaCalculada, POST(), ensureCuotasGeneradas(), GET(), ensureCuotasGeneradas() (+2 more)

### Community 28 - "Rutas API con Parametros"
Cohesion: 0.20
Nodes (13): DELETE(), GET(), Params, GET(), Params, POST(), deleteFile(), getSignedFileUrl() (+5 more)

### Community 29 - "Facturacion y Comisiones"
Cohesion: 0.17
Nodes (10): BillingItem, calculateTax(), calculateTotal(), createFactura(), createFacturaFromAsesoria(), createFacturaFromHonorario(), FacturaData, generateFacturaNumber() (+2 more)

### Community 30 - "Casos Recientes y Timeline"
Cohesion: 0.15
Nodes (10): CasoReciente, CasosRecientesProps, ESTADO_DEFAULT, ESTADO_STYLES, Paso, PASOS_BASE, SearchResult, DashboardPage() (+2 more)

### Community 31 - "Calendario de Audiencias"
Cohesion: 0.18
Nodes (11): ESTADO_BADGE_VARIANT, Asesoria, Audiencia, CalendarEvent, CalendarioPage(), DAYS, MONTHS, TIPO_AUDIENCIA_LABELS (+3 more)

### Community 33 - "Timeline de Cuotas"
Cohesion: 0.18
Nodes (9): ESTADO_BADGE, getEstadoBadge(), TimelineCuotas(), Asesoria, Audiencia, CalendarEvent, DAYS, MONTHS (+1 more)

### Community 34 - "PDF de Financiacion"
Cohesion: 0.35
Nodes (10): CuotaData, drawCuotaRow(), drawFooter(), drawHeader(), drawInfoBlock(), drawTableHeader(), FinanciacionData, formatCurrency() (+2 more)

### Community 35 - "Edicion de Audiencias"
Cohesion: 0.20
Nodes (8): Audiencia, Caso, ESTADOS, MODALIDADES, RESULTADOS, TIPO_AUDIENCIAS, UpdateAudienciaData, User

### Community 36 - "Archivos de Leads"
Cohesion: 0.25
Nodes (5): Archivo, Lead, FileViewerModal(), FileViewerModalProps, formatFileSize()

### Community 37 - "Pagina de Audiencias"
Cohesion: 0.25
Nodes (6): Audiencia, Caso, ESTADO_CONFIG, MODALIDAD_CONFIG, RESULTADO_CONFIG, TIPO_AUDIENCIAS

### Community 38 - "Honorarios"
Cohesion: 0.29
Nodes (5): Caso, ESTADO_CONFIG, Honorario, MODALIDAD_CONFIG, TIPO_HONORARIOS

### Community 39 - "PDF de Facturas"
Cohesion: 0.48
Nodes (5): FacturaData, formatCurrency(), formatDate(), generateFacturaPDF(), GET()

### Community 40 - "Responsables de Caso"
Cohesion: 0.29
Nodes (5): Caso, ESTADO_CONFIG, RESPONSABILIDADES_OPCIONES, Responsable, ROL_CONFIG

### Community 41 - "Actuaciones del Caso"
Cohesion: 0.33
Nodes (4): Actuacion, Caso, ESTADO_CONFIG, TIPO_ACTUACIONES

### Community 42 - "Detalle de Asesoria"
Cohesion: 0.33
Nodes (4): Asesoria, ESTADO_CONFIG, MODALIDAD_LABELS, TIPO_LABELS

### Community 43 - "Listado de Casos"
Cohesion: 0.33
Nodes (4): Caso, ESTADO_CONFIG, PRIORIDAD_CONFIG, TIPO_INSOLVENCIA_LABELS

### Community 44 - "Resumen de Cuotas"
Cohesion: 0.40
Nodes (3): FacturaSeguimiento, Props, ResumenSeguimiento

### Community 45 - "Nueva Factura"
Cohesion: 0.40
Nodes (4): Cliente, Honorario, ItemFactura, NuevaFacturaPage()

### Community 46 - "Componente Alert"
Cohesion: 0.50
Nodes (4): Alert(), AlertProps, alertVariants, iconStyles

### Community 47 - "Ruta API con Params"
Cohesion: 0.50
Nodes (3): Params, GET(), POST()

### Community 49 - "Cliente Prisma"
Cohesion: 0.50
Nodes (3): GET(), POST(), prismaClient

### Community 50 - "Tipos de NextAuth"
Cohesion: 0.50
Nodes (3): JWT, Session, User

### Community 51 - "Servicio de Usuarios"
Cohesion: 0.50
Nodes (3): GET(), POST(), usuariosService

## Knowledge Gaps
- **380 isolated node(s):** `version`, `configurations`, `eslintConfig`, `nextConfig`, `name` (+375 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card()` connect `Documentos y Estados` to `Modulo Cartera`, `Etapas Comerciales`, `Gestion de Usuarios y Roles`, `Roles y Utilidades`, `Aplicacion de Pagos`, `Filtros y Navegacion de Asesorias`, `Envio de Facturas`, `Detalle de Caso`, `Casos Recientes y Timeline`, `Calendario de Audiencias`, `Timeline de Cuotas`, `Edicion de Audiencias`, `Archivos de Leads`, `Pagina de Audiencias`, `Honorarios`, `Responsables de Caso`, `Actuaciones del Caso`, `Detalle de Asesoria`, `Listado de Casos`, `Resumen de Cuotas`, `Nueva Factura`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `CardBody()` connect `Envio de Facturas` to `Modulo Cartera`, `Etapas Comerciales`, `Documentos y Estados`, `Gestion de Usuarios y Roles`, `Roles y Utilidades`, `Aplicacion de Pagos`, `Filtros y Navegacion de Asesorias`, `Detalle de Caso`, `Casos Recientes y Timeline`, `Calendario de Audiencias`, `Timeline de Cuotas`, `Edicion de Audiencias`, `Archivos de Leads`, `Pagina de Audiencias`, `Honorarios`, `Responsables de Caso`, `Actuaciones del Caso`, `Detalle de Asesoria`, `Listado de Casos`, `Resumen de Cuotas`, `Nueva Factura`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `cn()` connect `Gestion de Usuarios y Roles` to `Procesos de Liquidacion`, `Modulo Cartera`, `Etapas Comerciales`, `Documentos y Estados`, `Layout Raiz de la App`, `Roles y Utilidades`, `Aplicacion de Pagos`, `Filtros y Navegacion de Asesorias`, `Envio de Facturas`, `Detalle de Caso`, `Casos Recientes y Timeline`, `Calendario de Audiencias`, `Timeline de Cuotas`, `Pagina de Audiencias`, `Honorarios`, `Responsables de Caso`, `Actuaciones del Caso`, `Nueva Factura`, `Componente Alert`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `requirePermission()` (e.g. with `DELETE()` and `PUT()`) actually correct?**
  _`requirePermission()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `cn()` (e.g. with `EditarFacturaPage()` and `EditarLeadPage()`) actually correct?**
  _`cn()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `version`, `configurations`, `eslintConfig` to the rest of the system?**
  _380 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Repositorio de Casos` be split into smaller, more focused modules?**
  _Cohesion score 0.05081585081585081 - nodes in this community are weakly interconnected._