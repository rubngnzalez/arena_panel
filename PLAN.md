# Panel de Gestión de Clientes Arena13 - Plan de Proyecto

## 📋 Visión General

Panel de gestión profesional integrado visualmente con arenatrece.com para administración de clientes, servicios contratados y seguimiento de proyectos.

---

## 🎨 Identidad Visual (Basada en arenatrece.com)

### Características detectadas:
- **Estilo**: Minimalista, técnico, profesional
- **Tipografía**: Inter (300, 400, 500)
- **Filosofía**: "La arena representa la adaptabilidad"
- **Paleta de colores propuesta**:
  ```css
  --color-primary: #0a0a0a;      /* Fondo principal oscuro */
  --color-secondary: #1a1a1a;    /* Fondo secundario */
  --color-accent: #3b82f6;       /* Acento azul moderno */
  --color-text: #f5f5f5;         /* Texto principal */
  --color-text-muted: #a0a0a0;   /* Texto secundario */
  --color-success: #10b981;      /* Éxito */
  --color-warning: #f59e0b;      /* Advertencia */
  --color-error: #ef4444;        /* Error */
  ```

---

## 🏗️ Arquitectura Técnica

### Stack Propuesto:
- **Frontend**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui (integración con Radix UI)
- **Estilos**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL + Auth + Realtime)
- **Despliegue**: GitHub Pages (export estático)
- **Gestión de estado**: React Context + Supabase Client
- **Iconos**: Lucide React
- **Formularios**: React Hook Form + Zod

---

## 📁 Estructura de Proyecto

```
c:/arenatrece/panel/
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD para GitHub Pages
├── public/
│   ├── logo.png                # Logo Arena13
│   ├── favicon.png
│   └── images/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── clientes/
│   │   │   ├── servicios/
│   │   │   ├── proyectos/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── clientes/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Cliente browser
│   │   │   ├── server.ts       # Cliente server
│   │   │   └── config.ts       # Configuración editable
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── types/
│   │   ├── cliente.ts
│   │   ├── servicio.ts
│   │   └── proyecto.ts
│   └── styles/
│       └── globals.css
├── .env.local.example          # Plantilla de configuración
├── .env.local                  # CONFIGURACIÓN SUPABASE (editable)
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
├── next.config.js
├── tailwind.config.ts
├── package.json
├── README.md
└── DNS_INSTRUCTIONS.md         # Guía de configuración DNS
```

---

## 🗄️ Esquema de Base de Datos (Supabase)

### Tablas Principales:

```sql
-- Clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  empresa VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'activo', -- activo, inactivo, potencial
  fecha_alta TIMESTAMP DEFAULT NOW(),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Servicios (catálogo extensible)
CREATE TABLE servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio_base DECIMAL(10,2),
  activo BOOLEAN DEFAULT true,
  categoria VARCHAR(50), -- web, branding, ia, marketing, consultoria
  created_at TIMESTAMP DEFAULT NOW()
);

-- Servicios contratados por cliente
CREATE TABLE cliente_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  servicio_id UUID REFERENCES servicios(id) ON DELETE CASCADE,
  estado VARCHAR(20) DEFAULT 'activo', -- activo, completado, pausado, cancelado
  fecha_inicio TIMESTAMP DEFAULT NOW(),
  fecha_fin TIMESTAMP,
  precio_acordado DECIMAL(10,2),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cliente_id, servicio_id)
);

-- Proyectos asociados a servicios
CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  servicio_id UUID REFERENCES cliente_servicios(id),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'planeacion', -- planeacion, en_progreso, revision, completado
  prioridad VARCHAR(20) DEFAULT 'media', -- baja, media, alta, urgente
  fecha_entrega_estimada TIMESTAMP,
  progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tareas dentro de proyectos
CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, en_progreso, completada
  prioridad VARCHAR(20) DEFAULT 'media',
  fecha_limite TIMESTAMP,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Actividad/Logs
CREATE TABLE actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  cliente_id UUID REFERENCES clientes(id),
  tipo VARCHAR(50) NOT NULL, -- cliente_creado, servicio_asignado, proyecto_actualizado, etc.
  descripcion TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Servicios Iniciales Propuestos:

| Servicio | Categoría | Descripción |
|----------|-----------|-------------|
| Diseño Web | web | Desarrollo de sitios web completos |
| Branding | branding | Identidad visual corporativa |
| IA Aplicada | ia | Implementación de soluciones IA |
| Growth Marketing | marketing | Estrategias de crecimiento |
| SEO | marketing | Optimización para motores de búsqueda |
| Automatización | ia | Flujos conversacionales y agentes |
| Consultoría | consultoria | Asesoramiento especializado |

---

## 🔐 Sistema de Autenticación

### Roles de Usuario:

| Rol | Permisos | Acceso |
|-----|----------|--------|
| **Admin** | Acceso total | Panel completo |
| **Cliente** | Solo lectura de sus datos | Portal cliente |
| **Colaborador** | Asignado a proyectos específicos | Proyectos asignados |

### Flujo de Autenticación:
- Login con email + contraseña (Supabase Auth)
- Login social opcional (Google, GitHub)
- Recuperación de contraseña
- Verificación de email

---

## ⚙️ Sistema de Configuración

### Archivo de Configuración (`.env.local`):

```env
# Supabase - Editable desde el panel settings
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Entorno: local | produccion
NEXT_PUBLIC_ENVIRONMENT=local

# Dominio para producciones
NEXT_PUBLIC_DOMAIN=arenatrece.com
```

### Página de Settings:
- **Configuración Supabase**: Formulario para editar credenciales
- **Gestión de Servicios**: Añadir/editar servicios del catálogo
- **Gestión de Usuarios**: Admins y colaboradores
- **Configuración de Email**: Plantillas de notificaciones

---

## 🚀 Sistema de Despliegue

### Botón de Acceso Rápido:

```
┌─────────────────────────────────┐
│  🚀 Publicar Cambios           │
│  ─────────────────────────────  │
│  [Publicar en GitHub Pages]    │
│  ─────────────────────────────  │
│  Estado: ✅ Listo para publicar │
│  Último deploy: hace 2 días     │
└─────────────────────────────────┘
```

### Workflow GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run export
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## 🌐 Instrucciones DNS (Documento Específico)

### Archivo: `DNS_INSTRUCTIONS.md`

Contendrá instrucciones paso a paso para:

#### Registro A (Apuntar a GitHub Pages):
```
Tipo: A
Nombre: @
Valor: 185.199.108.153
Valor: 185.199.109.153
Valor: 185.199.110.153
Valor: 185.199.111.153
TTL: 3600
```

#### Subdominio (panel.arenatrece.com):
```
Tipo: CNAME
Nombre: panel
Valor: arenatrece.github.io
TTL: 3600
```

### Integración en el Panel:
Icono de ayuda con las instrucciones visuales y recordatorios.

---

## ✨ Funcionalidades del Panel

### Dashboard Principal:
```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Dashboard - Arena13 Panel                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Métricas                                                │
│  ─────────────────────────────────────────────────────────  │
│  [24] Clientes Activos    [8] Proyectos en Curso           │
│  [12] Servicios Activos   [€45K] Ingreso Mensual Estimado  │
│                                                              │
│  ⚡ Acciones Rápidas                                        │
│  ─────────────────────────────────────────────────────────  │
│  [+ Nuevo Cliente]  [+ Nuevo Proyecto]  [Ver Actividad]    │
│                                                              │
│  📈 Proyectos Recientes                                     │
│  ─────────────────────────────────────────────────────────  │
│  │ Web E-commerce │ Cliente XYZ │ 75% │ En progreso      │
│  │ Rebranding     │ Acme Corp   │ 30% │ Planeación        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Gestión de Clientes:
- **Lista** con filtros (estado, servicio, fecha)
- **Ficha detallada** del cliente
- **Historial** de servicios y proyectos
- **Notas** internas
- **Documentos** asociados

### Gestión de Servicios:
- **Catálogo** de servicios editables
- **Asignación** a clientes
- **Seguimiento** de estado
- **Facturación** (base para futuro)

### Gestión de Proyectos:
- **Kanban** o lista de proyectos
- **Tareas** con subtareas
- **Timeline** de hitos
- **Colaboradores** asignados

---

## 🎁 Funcionalidades Adicionales Propuestas

### 1. Portal del Cliente:
```typescript
// Vista simplificada para clientes
- Ver sus proyectos activos
- Consultar estado de servicios
- Descargar recursos/diseños
- Comunicación directa
```

### 2. Sistema de Notificaciones:
- Email automático en hitos de proyecto
- Notificaciones en panel
- Resumen semanal para admins

### 3. Integraciones Futuras:
- **KiloCode**: Para generación de código automática
- **OpenDesign**: Para colaboración en diseños
- API para integración con arenatrece.com

### 4. Reportes y Analytics:
- Dashboard con métricas de negocio
- Exportación de datos (CSV, PDF)
- Gráficos de ingreso por servicio

### 5. Gestión Documental:
- Repositorio de archivos por cliente
- Versionado de diseños
- Galería de entregables

### 6. Sistema de Tickets/Soporte:
- Tickets por cliente
- Prioridad y SLA
- Historial de comunicaciones

### 7. Calculadora de Presupuestos:
- Generador de presupuestos
- Plantillas por servicio
- Exportación a PDF

### 8. Integración con arenatrece.com:
- Formulario de contacto crea lead en panel
- Testimonios gestionados desde panel
- Portfolio sincronizado con proyectos

---

## 📅 Roadmap de Implementación

### Fase 1 - Foundation (Semana 1-2):
- [ ] Estructura del proyecto Next.js
- [ ] Configuración Supabase
- [ ] Sistema de autenticación
- [ ] Diseño base UI (shadcn/ui)

### Fase 2 - Core Features (Semana 3-4):
- [ ] Gestión de clientes
- [ ] Catálogo de servicios
- [ ] Dashboard principal
- [ ] Configuración editable

### Fase 3 - Advanced (Semana 5-6):
- [ ] Gestión de proyectos y tareas
- [ ] Portal del cliente
- [ ] Sistema de actividad/logs
- [ ] Deploy GitHub Pages

### Fase 4 - Integración (Semana 7-8):
- [ ] Integración KiloCode/OpenDesign
- [ ] Sincronización arenatrece.com
- [ ] Sistema de notificaciones
- [ ] Reportes y exportación

---

## 🛠️ Comandos de Desarrollo

```bash
# Crear proyecto
npm create next-app@latest

# Instalar dependencias
npm install @supabase/supabase-js @supabase/ssr
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react
npm install react-hook-form zod @hookform/resolvers

# Shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select textarea
npx shadcn-ui@latest add dialog dropdown-menu table badge avatar
npx shadcn-ui@latest add tabs scroll-area separator

# Desarrollo
npm run dev

# Build para producción
npm run build
npm run export  # Para GitHub Pages

# Supabase
npx supabase init
npx supabase db push
```

---

## 📝 Checklist de Inicio

- [ ] Crear repositorio GitHub
- [ ] Crear proyecto en Supabase
- [ ] Configurar GitHub Pages
- [ ] Configurar dominio/subdominio
- [ ] Diseñar logo/favicon
- [ ] Definir servicios iniciales
- [ ] Crear usuarios admin
- [ ] Configurar email templates

---

*Plan generado para Arena13 - Diseño de Producto Digital & IA*
