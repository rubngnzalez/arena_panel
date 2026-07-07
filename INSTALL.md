# 🚀 Guía de Instalación - Arena13 Panel

Guía paso a paso para configurar y desplegar el Panel de Gestión de Arena13.

---

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener:

- ✅ **Node.js 20+** instalado ([nodejs.org](https://nodejs.org))
- ✅ **Cuenta en Supabase** ([supabase.com](https://supabase.com) - Plan gratis)
- ✅ **Cuenta en GitHub** ([github.com](https://github.com))
- ✅ **Git** instalado ([git-scm.com](https://git-scm.com))

---

## 🔧 Paso 1: Configurar Supabase

### 1.1 Crear Proyecto

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Clic en **"New Project"**
3. Rellena:
   - **Name**: `arena13-panel`
   - **Database Password**: (guarda esta contraseña)
   - **Region**: `Eu West (Ireland)` o la más cercana

### 1.2 Obtener Credenciales

1. En tu proyecto, ve a **Settings** → **API**
2. Copia estos valores (los necesitarás después):

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Ejecutar Migraciones

1. Ve a **SQL Editor** en Supabase
2. Crea un nuevo query
3. Copia el contenido de [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)
4. Clic en **Run** ▶️
5. Repite con [002_auth_schema.sql](supabase/migrations/002_auth_schema.sql)

### 1.4 Crear Usuario Admin

En el SQL Editor, ejecuta:

```sql
-- Crea un usuario admin (cambia el email)
-- Primero registra el usuario en: https://tu-project.supabase.co/auth/v1/verify?token=...

-- Luego asigna el rol:
UPDATE perfiles_usuario
SET rol = 'admin'
WHERE email = 'admin@arenatrece.com';
```

---

## 💻 Paso 2: Instalar Localmente

### 2.1 Clonar e Instalar

```bash
# Clonar el repositorio
git clone https://github.com/arenatrece/panel.git
cd panel

# Instalar dependencias
npm install

# Instalar shadcn/ui (opcional - ya configurado)
npx shadcn-ui@latest init
```

### 2.2 Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.local.example .env.local

# Editar con tus credenciales de Supabase
# En Windows: notepad .env.local
# En Mac/Linux: nano .env.local
```

Contenido de `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ENVIRONMENT=local
NEXT_PUBLIC_DOMAIN=arenatrece.com
```

### 2.3 Ejecutar en Desarrollo

```bash
npm run dev
```

Visita: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Paso 3: Configurar GitHub Pages

### 3.1 Crear Repositorio

1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio
2. Nombre: `panel`
3. No inicialices con README (ya tienes uno)

### 3.2 Push a GitHub

```bash
git add .
git commit -m "Initial commit: Arena13 Panel"
git branch -M main
git remote add origin https://github.com/arenatrece/panel.git
git push -u origin main
```

### 3.3 Activar GitHub Pages

1. En tu repositorio, ve a **Settings** → **Pages**
2. **Source**: Selecciona **GitHub Actions**
3. (El workflow ya está configurado en `.github/workflows/deploy.yml`)

### 3.4 Configurar Secrets (Recomendado)

En **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🌍 Paso 4: Configurar Dominio

### 4.1 Añadir Custom Domain en GitHub

1. En **Settings** → **Pages** → **Custom domain**
2. Introduce: `panel.arenatrece.com`
3. GitHub te dará un registro TXT para verificar

### 4.2 Configurar DNS

En tu registrador (donde compraste arenatrece.com), añade:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| CNAME | panel | arenatrece.github.io | 3600 |

**Para verificar dominio:**

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| TXT | _github-challenge-panel-arenatrece | (código de GitHub) | 3600 |

### 4.3 Esperar Propagación

- Tiempo: 10 min - 48 horas
- Verifica en: [dnschecker.org](https://dnschecker.org/#CNAME/panel.arenatrece.com)

### 4.4 Habilitar HTTPS

Una vez propagado, en **GitHub Pages Settings** activa **"Enforce HTTPS"**

---

## ✅ Paso 5: Verificación

### Checklist

- [ ] Panel funciona en `localhost:3000`
- [ ] Login funciona con usuario Supabase
- [ ] GitHub Actions deploy sin errores
- [ ] `panel.arenatrece.com` es accesible
- [ ] HTTPS está activo (candado verde)

---

## 🎯 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor local

# Build
npm run build            # Construir para producción
npm run export           # Exportar estático

# Supabase
npx supabase db push     # Aplicar migraciones
npx supabase gen types   # Generar tipos TypeScript

# Linter
npm run lint             # Verificar código
```

---

## 🔌 Integraciones Futuras

### KiloCode
```env
KILOCODE_API_KEY=tu_api_key
KILOCODE_PROJECT_ID=tu_project_id
```

### OpenDesign
```env
OPENDESIGN_API_KEY=tu_api_key
OPENDESIGN_TEAM_ID=tu_team_id
```

---

## 📚 Troubleshooting

### Error: "Supabase credentials not configured"
→ Revisa que `.env.local` tiene las credenciales correctas

### Error: "Module not found"
→ Ejecuta `npm install`

### GitHub Pages no funciona
→ Verifica que el workflow en Actions se ejecutó sin errores

### Dominio no funciona
→ Usa dnschecker.org para verificar la propagación DNS

---

## 🆘 Soporte

- **Documentación Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **GitHub Pages Docs**: [docs.github.com/pages](https://docs.github.com/pages)
- **Arena13**: [arenatrece.com](https://arenatrece.com)

---

*¡Tu panel de gestión está listo! 🎉*
