# AGENTS.md — Panel Arena13

Guía de contexto para cualquier agente (Kilo/Claude) que abra este proyecto.
**Propietario**: Arena13 — Diseño de Producto Digital & IA · Rubén González.

---

## 1. Visión general

Panel de gestión de clientes, servicios y proyectos. Integrado visualmente con **arenatrece.com**.
Alojamiento previsto: **GitHub Pages** (export estático) + **Supabase** (BD + Auth).

## 2. Stack

| Tecnología | Uso |
|------------|-----|
| Next.js 15 (App Router) | Framework React |
| `output: 'export'` | Export estático para GitHub Pages |
| Supabase (`@supabase/ssr`) | BD PostgreSQL + Auth + Realtime |
| shadcn/ui + Radix UI | Componentes base |
| Tailwind CSS | Estilos |
| Lucide React | Iconos |
| React Hook Form + Zod | Formularios y validación |

## 3. Comandos

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # build + export a ./out
npm run lint         # (falta configurar ESLint base)
npm run supabase:generate  # regenera tipos TS desde Supabase (requiere CLI v2+ y password BD en SUPABASE_DB_PASSWORD)
npm run supabase:push     # aplica migraciones (LOCAL, historico — NO usar contra PabloRecursos)
powershell -ExecutionPolicy Bypass -File supabase\aplicar-remoto.ps1  # aplica migrations-arena al proyecto PabloRecursos via Management API (sin password BD)
```

> ⚠️ **Importante**: NO ejecutar `npm run build` con el `npm run dev` corriendo — corrompe la caché `.next` (error `Cannot find module './XX.js'`). Parar el dev, borrar `.next`, y rearrancar.

## 4. Estructura

```
src/
├── app/
│   ├── (auth)/login/         # Login
│   ├── (dashboard)/          # Panel principal (protegido)
│   │   ├── dashboard/  clientes/  servicios/  proyectos/
│   │   ├── tickets/  documentos/  notificaciones/  features/
│   │   ├── settings/  integraciones/{kilocode,opendesign}/
│   ├── (cliente)/portal/     # Portal del cliente
│   ├── dashboard-preview/    # Demo estática (sin Supabase)
│   ├── layout.tsx            # Root layout (Inter, dark)
│   └── page.tsx              # Landing
├── components/
│   ├── ui/                   # shadcn (button, card, input, badge, dialog, ...)
│   └── dashboard/            # sidebar, dashboard-header
├── lib/
│   ├── supabase/{client,server,config,database.types}.ts
│   ├── features.ts           # Feature flags
│   ├── integraciones/        # kilocode, opendesign, config
│   └── utils.ts
├── hooks/  styles/  types/
supabase/migrations/        # 001..014 (esquema completo, HISTORICO proyecto Arena13)
supabase/migrations-arena/  # misma migraciones adaptadas al esquema arena_panel (PabloRecursos)
supabase/aplicar-remoto.ps1 # aplica migrations-arena via Management API
.github/workflows/deploy.yml  # CI/CD GitHub Pages
```

## 5. Sistema de diseño — Marca Arena13

Replica de la identidad de **arenatrece.com**. **Única fuente de verdad: `src/styles/globals.css` y `tailwind.config.ts`.**

**Tokens:**
- Negro puro `#000000` · Blanco `#FFFFFF`
- Púrpura `#787DFF` (HSL 238 100% 75%) → `--primary`
- Cian `#01A9F2` (HSL 198 98% 48%) → `--accent`
- Gradiente marca: `linear-gradient(90deg, #01A9F2, #787DFF)` → `bg-arena-gradient`

**Estética:** liquid glass (backdrop-blur), pills (`rounded-pill`), glow morado/cian, tipografía Inter 300/400/500, tracking negativo en titulares.

**Utilidades propias (en globals.css):** `.glass`, `.glass-strong`, `.arena-card`, `.arena-btn`, `.arena-btn-outline`, `.arena-input`, `.arena-badge`, `.text-gradient`, `.bg-grid`, `.glow-purple`, `.glow-cyan`, `.animate-arena-pulse`, `.animate-fade-in`.

**Componentes UI** ya rediseñados al sistema de marca: `button`, `input`, `badge`, `card`, `sidebar`, `dashboard-header`, páginas `login`, `page` (landing) y `dashboard`.

## 6. Estado actual

### ✅ Hecho
- Arquitectura completa Next.js + Supabase.
- **MIGRADO A PabloRecursos** (cuenta nueva, ref `iqshrizfepjmckcpdljc`): las 14 migraciones aplicadas en el **esquema dedicado `arena_panel`** (2026-08-17). El proyecto antiguo Arena13 queda abandonado. El esquema `public` de PabloRecursos (tablas `ap_*`/`psy_*`) NO se toca.
- Rediseño de marca aplicado a: globals.css, tailwind.config.ts, button/input/badge/card, sidebar, header, login, landing, dashboard.
- **6 bugs de auditoría resueltos** (ver abajo).
- Build verificado OK (18 rutas estáticas, export a `./out`).
- Workflow CI/CD **funcionando en GitHub Pages** (deploy automático en push a main).
- **GitHub**: repo `rubngnzalez/arena_panel` (público), 2 secrets configurados, Pages activado.
- **Supabase**: credenciales reales en `.env.local`, migraciones aplicadas.

### 🔧 Bugs resueltos (auditoría)
1. ✅ **Logout**: botón de cerrar sesión añadido en `sidebar.tsx` (tarjeta de usuario) y `cliente-sidebar.tsx`. Cableado vía `onLogout` desde ambos layouts.
2. ✅ **Variantes badge/button inexistentes**: añadidas variantes `success`/`warning`/`info` en `badge.tsx`; corregido `variant="arena"` y `variant="success"` (button) en `settings/`.
3. ✅ **Clases inexistentes `arena-accent`/`arena-light`/`arena-dark`**: migradas al sistema de marca en `clientes/`, `servicios/`, `proyectos/`, `settings/` y `dialog.tsx` (0 ocurrencias restantes).
4. ✅ **Favicon**: cableado `favicon.svg`/`logo.svg` vía `metadata.icons` en `app/layout.tsx`.
5. ✅ **Login con feedback de error**: estado de error + mensaje visible (caja `destructive`) en `login/page.tsx`.
6. ✅ **Estados de error en páginas**: añadido estado `error` con botón "Reintentar" en `clientes/`, `servicios/` y `proyectos/`.

### 🟠 Pulir (pendiente, no bloqueante)
7. `database.types.ts` es placeholder escrito a mano (6.4KB). Regenerar con `npm run supabase:generate` cuando Supabase esté activo.
8. ESLint sin configurar (`next lint` pide prompt interactivo). Crear `.eslintrc.json` base.
9. `next.config.js`: `typescript.ignoreBuildErrors: true` oculta errores de tipo.
10. `next.config.js`: `headers()` se ignora con `output: 'export'` (warnings en build). Para headers reales hace falta Vercel/Netlify/Cloudflare.

## 7. Próximos pasos

1. **DNS custom domain**: añadir CNAME `panel` → `rubngnzalez.github.io` en el proveedor DNS de arenatrece.com. Tras propagar, el panel estará en https://panel.arenatrece.com (GitHub emite certificado HTTPS automáticamente).
2. **Usuario admin**: crear el primer usuario admin en Supabase Auth + asignar rol `admin` en `perfiles_usuario`.
3. **Regenerar tipos**: ejecutar `npm run supabase:generate` para que `database.types.ts` refleje el esquema real aplicado (ahora es placeholder).
4. **ESLint**: crear `.eslintrc.json` base (`next lint` pide prompt interactivo).
5. **Probar flujo completo** con credenciales reales (login/logout/CRUD).

### CI/CD (GitHub Pages)
- Repo: `rubngnzalez/arena_panel` (público).
- URL actual: https://rubngnzalez.github.io/arena_panel/ (hasta que el DNS custom propague).
- Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (en GitHub, no en código).
- Deploy automático en cada push a `main`. También manual vía `workflow_dispatch`.

## 8. Reglas del proyecto

- Idioma de UI y docs: **español**.
- Probar acciones que requieran la **URL de producción** de Supabase → avisar antes.
- Antes de desplegar en Supabase → informar claramente de cambios, comandos y verificaciones.
- No usar la URL local para conexiones con servidores/paneles en producción.
- **No commitear** salvo petición explícita del usuario.
- Tras cambios en `src/`, avisar para re-desplegar antes de probar.

## 9. Proyectos Supabase — RESTRICCIÓN CRÍTICA

La cuenta tiene varios proyectos. **PERMISO ESTRICTO**:

- ✅ **ÚNICO proyecto autorizado**: `PabloRecursos` (ref: `iqshrizfepjmckcpdljc`) → https://iqshrizfepjmckcpdljc.supabase.co
- El panel vive SOLO en el **esquema `arena_panel`** de ese proyecto. PROHIBIDO modificar el esquema `public` (tablas `ap_*`/`psy_*` de otras apps), los buckets `fornieles`/`ap-marcas` ni el `site_url` de Auth (`agenda.pfornieles.com`).
- 🚫 **PROHIBIDO tocar, leer o escribir**: `PanelDropBox` (ref: `oqeidyljaqedicmjgciu`) y cualquier otro proyecto de la cuenta.
- Antes de cualquier acción con la CLI (`supabase link`, `db push`, etc.), verificar SIEMPRE que el `--project-ref` apunta a `iqshrizfepjmckcpdljc` (PabloRecursos).
- Migraciones del panel: **`supabase/migrations-arena/`** aplicadas con `supabase/aplicar-remoto.ps1` (Management API, token de acceso; NO requiere password BD). La carpeta `supabase/migrations/` es histórica del proyecto Arena13 antiguo — no re-aplicar.
- El trigger `on_auth_user_created` está blindado: solo crea perfiles de usuarios con metadata `app: 'arena_panel'`.
