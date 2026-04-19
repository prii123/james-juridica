# 🔐 Configuración de Usuario Admin para Pruebas

## 📋 Credenciales

```
Email:      admin@gmail.com
Contraseña: 12345678
Rol:        Administrador (Acceso completo)
```

---

## ⚙️ Configuración de la Base de Datos

### Opción 1: Usar Base de Datos Local (PostgreSQL)

Si deseas usar PostgreSQL localmente:

#### 1. Instalar PostgreSQL
```bash
# En Windows - Descargar e instalar desde:
https://www.postgresql.org/download/windows/

# En Mac
brew install postgresql

# En Linux
sudo apt-get install postgresql postgresql-contrib
```

#### 2. Crear Base de Datos
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear BD y usuario
CREATE DATABASE juridica_insolvencia;
CREATE USER juridica_user WITH PASSWORD 'cambiar_password';
ALTER ROLE juridica_user SET client_encoding TO 'utf8';
ALTER ROLE juridica_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE juridica_user SET default_transaction_deferrable TO on;
ALTER ROLE juridica_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE juridica_insolvencia TO juridica_user;
\q
```

#### 3. Actualizar .env
```bash
# En el archivo .env, reemplazar DATABASE_URL con:
DATABASE_URL="postgresql://juridica_user:cambiar_password@localhost:5432/juridica_insolvencia?schema=public"
```

#### 4. Ejecutar Migraciones
```bash
npm run db:generate
npm run db:push
```

---

### Opción 2: Usar Base de Datos Remota (DigitalOcean)

Si ya tienes acceso a la BD remota:

#### 1. Obtener Credenciales
Contacta al equipo de DevOps para obtener:
- Hostname: `db-postgresql-xxx.f.db.ondigitalocean.com`
- Puerto: `25060`
- Usuario: `doadmin`
- Contraseña: (solicitar)
- Base de datos: `juridica`

#### 2. Actualizar .env
```bash
# Reemplazar DATABASE_URL con credenciales correctas:
DATABASE_URL="postgresql://doadmin:PASSWORD@db-postgresql-xxx.f.db.ondigitalocean.com:25060/juridica?sslmode=require"
```

#### 3. Ejecutar Migraciones (si es primera vez)
```bash
npm run db:generate
npm run db:push
```

---

## 🚀 Crear Usuario Admin

### Opción 1: Ejecutar Script de Seed (Recomendado)

```bash
# Crear usuario admin@gmail.com con contraseña 12345678
npx tsx prisma/seed-admin.ts
```

**Salida esperada:**
```
🔐 Creando usuario admin de prueba...
✅ Usuario creado exitosamente!

═══════════════════════════════════════
📋 CREDENCIALES DE ACCESO
═══════════════════════════════════════
📧 Email:      admin@gmail.com
🔐 Contraseña: 12345678
═══════════════════════════════════════

👤 ID de Usuario: cm...
🎯 Rol: Administrador (Acceso completo)
```

### Opción 2: Usar Prisma Studio

```bash
# Abrir Prisma Studio
npm run db:studio

# En el navegador:
# 1. Ir a tabla "users"
# 2. Click en "Add record"
# 3. Llenar campos:
#    - email: admin@gmail.com
#    - password: (generar hash con bcrypt - ver abajo)
#    - nombre: Admin
#    - apellido: Prueba
#    - documento: 1111111111
#    - telefono: 3001111111
#    - activo: true
#    - roleId: (seleccionar "Administrador")
```

### Opción 3: SQL Directo

```sql
-- Primero, obtener el hash de la contraseña 12345678
-- Usar: bcrypt.hash('12345678', 12)
-- Resultado: $2a$12$... (hash completo)

-- Obtener ID del rol Administrador
SELECT id FROM roles WHERE nombre = 'Administrador';

-- Insertar usuario (reemplazar ROLE_ID y HASH_PASSWORD)
INSERT INTO users (
  id, email, password, nombre, apellido, 
  documento, telefono, activo, "roleId", 
  "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'admin@gmail.com',
  '$2a$12$HASH_PASSWORD_AQUI',
  'Admin',
  'Prueba',
  '1111111111',
  '3001111111',
  true,
  'ROLE_ID_AQUI',
  now(),
  now()
);
```

---

## 🧪 Probar Login

### 1. Iniciar Aplicación
```bash
npm run dev
```

### 2. Navegar a Login
```
http://localhost:3000/auth/login
```

### 3. Ingresar Credenciales
```
Email:      admin@gmail.com
Contraseña: 12345678
```

### 4. Verificar Dashboard
- Deberías ver el dashboard principal
- Deberías tener acceso a todos los módulos
- Deberías ver rol "Administrador"

---

## 🔄 Generar Hash de Contraseña (Node.js)

Si necesitas otro hash bcrypt:

```bash
node

# En la consola:
const bcrypt = require('bcryptjs');

// Para generar hash
bcrypt.hash('tu-contraseña-aqui', 12).then(hash => {
  console.log('Hash:', hash);
});

// Para verificar
bcrypt.compare('tu-contraseña-aqui', 'hash-aqui').then(result => {
  console.log('Válido:', result);
});

// Salir
.exit
```

---

## 🛠️ Troubleshooting

### Error: "Error opening a TLS connection"
**Causa:** Database URL incorrecta o servidor BD inaccesible

**Solución:**
1. Verificar DATABASE_URL en .env
2. Verificar conectividad a servidor BD
3. Si está en DigitalOcean, verificar firewall

### Error: "Unique constraint failed: User_email_key"
**Causa:** El usuario ya existe

**Solución:**
```bash
# Opción 1: Eliminar usuario existente
npx prisma studio
# Ir a tabla users, buscar admin@gmail.com, eliminar

# Opción 2: Usar SQL directo
DELETE FROM users WHERE email = 'admin@gmail.com';
```

### Error: "Relation 'roles' does not exist"
**Causa:** No se ejecutaron las migraciones

**Solución:**
```bash
npm run db:generate
npm run db:push
```

---

## 📊 Verificar Datos Creados

### Con Prisma Studio
```bash
npm run db:studio
# Navegar a tablas: users, roles, permissions, role_permissions
```

### Con SQL
```sql
-- Ver usuario
SELECT id, email, nombre, apellido FROM users WHERE email = 'admin@gmail.com';

-- Ver rol del usuario
SELECT u.email, r.nombre FROM users u
JOIN roles r ON u."roleId" = r.id
WHERE u.email = 'admin@gmail.com';

-- Ver permisos del rol
SELECT p.nombre FROM permissions p
JOIN role_permissions rp ON p.id = rp."permissionId"
JOIN roles r ON r.id = rp."roleId"
WHERE r.nombre = 'Administrador';
```

---

## 🔐 Cambiar Contraseña Después

### Con Prisma Studio
```bash
npm run db:studio
# 1. Ir a tabla users
# 2. Buscar admin@gmail.com
# 3. Generar nuevo hash con Node.js (ver arriba)
# 4. Actualizar campo password
```

### Con SQL
```sql
-- Generar hash primero (ver sección "Generar Hash de Contraseña")
UPDATE users 
SET password = '$2a$12$NUEVO_HASH'
WHERE email = 'admin@gmail.com';
```

---

## ✅ Checklist de Configuración

- [ ] Base de datos instalada y funcionando
- [ ] DATABASE_URL en .env configurada correctamente
- [ ] Migraciones ejecutadas (`npm run db:push`)
- [ ] Usuario admin@gmail.com creado
- [ ] Rol Administrador con permisos asignados
- [ ] Login funciona con admin@gmail.com / 12345678
- [ ] Dashboard carga correctamente
- [ ] Acceso completo a todos los módulos

---

## 📝 Notas Importantes

1. **Contraseña de Prueba:** Cambiar 12345678 por contraseña segura antes de producción
2. **Backup:** Hacer backup de la BD antes de cambios importantes
3. **Roles:** No eliminar rol "Administrador", solo crear nuevos roles
4. **Permisos:** Asignar permisos granulares a usuarios regulares

---

## 🆘 Contacto

Si tienes problemas:

1. Revisar logs: `npm run dev`
2. Verificar DATABASE_URL en .env
3. Verificar conectividad a BD
4. Ejecutar migraciones nuevamente: `npm run db:push`

---

**¡Listo! Ahora puedes hacer pruebas con el usuario admin@gmail.com** 🎉
