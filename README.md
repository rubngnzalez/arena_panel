# 🏢 Panel de Gestión de Clientes - Arena13

Sistema profesional de gestión de clientes, servicios y proyectos para **Arena13 - Diseño de Producto Digital & IA**.

---

## ✨ Características

- 🎨 **Diseño integrado** con arenatrece.com
- 🔐 **Autenticación** segura con Supabase
- 👥 **Gestión de clientes** con servicios contratados
- 📊 **Dashboard** con métricas en tiempo real
- 🚀 **Despliegue automatizado** en GitHub Pages
- ⚙️ **Configuración editable** desde el panel
- 🌐 **Instrucciones DNS** integradas

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Next.js 15** | Framework React con App Router |
| **Supabase** | Base de datos, Auth, Realtime |
| **shadcn/ui** | Componentes UI profesionales |
| **Tailwind CSS** | Estilos con identidad Arena13 |
| **TypeScript** | Tipado seguro |
| **GitHub Pages** | Hosting estático |

---

## 📋 Requisitos Previos

1. **Cuenta en Supabase**: [supabase.com](https://supabase.com)
2. **Cuenta en GitHub**: [github.com](https://github.com)
3. **Node.js 20+**: [nodejs.org](https://nodejs.org)

---

## 🚀 Instalación Rápida

### 1. Clonar e Instalar

```bash
# Clonar repositorio
git clone https://github.com/arenatrece/panel.git
cd panel

# Instalar dependencias
npm install
```

### 2. Configurar Supabase

```bash
# Copiar archivo de configuración
cp .env.local.example .env.local

# Editar con tus credenciales de Supabase
# Obtén las credenciales en: https://supabase.com/dashboard/project/_/settings/api
```

### 3. Configurar Base de Datos

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Inicializar y aplicar migraciones
npx supabase db push
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Visita: `http://localhost:3000`

---

## ⚙️ Configuración Producción

### Pasos para GitHub Pages

1. **Crear repositorio GitHub**: `arenatrece/panel`

2. **Configurar Secrets** en Settings → Secrets → Actions:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Configurar DNS**: Sigue [DNS_INSTRUCTIONS.md](DNS_INSTRUCTIONS.md)

4. **Activar GitHub Pages**:
   - Settings → Pages → Source: GitHub Actions

---

## 📁 Estructura del Proyecto

```
panel/
├── src/
│   ├── app/                    # App Router
│   │   ├── (auth)/             # Rutas de autenticación
│   │   ├── (dashboard)/        # Rutas del panel
│   │   └── api/                # API Routes
│   ├── components/             # Componentes React
│   │   ├── ui/                 # shadcn/ui
│   │   ├── auth/               # Auth components
│   │   └── dashboard/          # Dashboard components
│   └── lib/                    # Utilidades
│       ├── supabase/           # Cliente Supabase
│       └── utils.ts            # Helpers
├── supabase/
│   └── migrations/             # Migraciones SQL
└── public/                     # Assets estáticos
```

---

## 🎨 Personalización del Diseño

### Colores de Arena13

Edita `src/styles/globals.css` para ajustar la paleta:

```css
:root {
  --color-primary: #0a0a0a;
  --color-accent: #3b82f6;
  --color-text: #f5f5f5;
  /* ... */
}
```

### Logo y Assets

Reemplaza los archivos en `public/`:
- `logo.png` - Logo principal
- `favicon.png` - Favicon del navegador

---

## 🔐 Usuarios Iniciales

Tras la instalación, crea el usuario admin:

```sql
-- En Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@arenatrece.com', '', NOW());

-- Luego asigna rol en tabla roles (si existe)
```

---

## 📊 Funcionalidades

### Dashboard
- 📈 Métricas en tiempo real
- ⚡ Acciones rápidas
- 📋 Proyectos recientes
- 📢 Actividad reciente

### Clientes
- 👤 Gestión completa de clientes
- 📋 Servicios contratados
- 📁 Documentos asociados
- 📝 Notas internas

### Servicios
- 📦 Catálogo extensible
- ✏️ Crear/Editar servicios
- 💰 Precios base
- 🏷️ Categorías

### Proyectos
- 📌 Tablero Kanban
- ✅ Tareas y subtareas
- 📅 Timeline e hitos
- 👥 Colaboradores

---

## 🔄 Integraciones

### KiloCode (Futuro)
Para integración con generación de código:

```env
KILOCODE_API_KEY=tu_api_key
KILOCODE_PROJECT_ID=tu_project_id
```

### OpenDesign (Futuro)
Para colaboración en diseños:

```env
OPENDESIGN_API_KEY=tu_api_key
OPENDESIGN_TEAM_ID=tu_team_id
```

---

## 🚀 Despliegue Automático

Al hacer push a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

GitHub Actions automáticamente:
1. Ejecuta tests
2. Construye el proyecto
3. Despliega a GitHub Pages
4. Actualiza `panel.arenatrece.com`

---

## 📖 Documentación Adicional

- [Plan del proyecto](PLAN.md) - Planificación detallada
- [Instrucciones DNS](DNS_INSTRUCTIONS.md) - Configuración de dominios
- [Esquema de BD](supabase/migrations/) - Estructura de base de datos

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea rama feature: `git checkout -b feature/nueva-funcion`
3. Commit cambios: `git commit -m 'feat: añadir funcionalidad'`
4. Push: `git push origin feature/nueva-funcion`
5. Pull Request

---

## 📝 Licencia

Copyright © 2026 Arena13 - Diseño de Producto Digital & IA

---

## 📞 Soporte

- **Email**: info@arenatrece.com
- **Web**: [arenatrece.com](https://arenatrece.com)

---

*Desarrollado con ❤️ por Arena13*
