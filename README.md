# Acienda

Aplicación web mobile-first para gestionar una pequeña explotación ganadera (ovejas y conejas). Usuario único, contraseña única, instalable como PWA en el móvil.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + componentes estilo **shadcn/ui** (Radix Primitives)
- **Drizzle ORM** + **PostgreSQL** (compatible con Neon, Supabase, Vercel Marketplace)
- **Zod** para validación
- **date-fns** con locale español
- **Sonner** para toasts
- **PWA** vía `manifest.webmanifest` + service worker mínimo (instalable en iOS/Android)
- Server Actions para todas las mutaciones
- Autenticación con cookie HMAC firmada (sin dependencias externas)

## Estado del proyecto

- **Fase 1 — Base** (completa): scaffolding, Tailwind, Drizzle, login, layout móvil, PWA.
- **Fase 2 — Ovejas** (completa): listado con buscador y filtro, alta/edición, ficha con tabs (Datos, Vacunas, Salud, Crianzas, Gastos), CRUDs anidados con dialogs, detalle de crianza con corderos.
- **Fase 3 — Conejas** (completa): mismo flujo que ovejas con camada única por crianza, contador de bajas naturales y registro de matanza con unidades sacrificadas.
- **Fase 4 — Finanzas** (completa): alta rápida con presets de categoría, listado filtrable por mes/año/tipo/categoría/animal, balances mes y año, gráfica de barras de los últimos 12 meses.
- **Fase 5 — Dashboard y calendario** (completa): inicio con próximas vacunas (≤30d), partos esperados, animales en tratamiento y balance del mes; vista mensual de calendario con marcadores por tipo de evento y eventos clicables que llevan a la ficha del animal.

## Requisitos

- Node.js >= 20 (recomendado 24 LTS)
- pnpm >= 9
- Una base de datos PostgreSQL accesible (local con Docker, [Neon](https://neon.tech), Supabase…)

## Instalación local

```bash
git clone <repo> acienda
cd acienda
pnpm install
cp .env.example .env
# Edita .env con tus valores (ver sección "Variables de entorno")
pnpm db:push       # Crea las tablas en la base de datos
pnpm dev           # Servidor de desarrollo en http://localhost:3000
```

> Al abrir la app por primera vez, el middleware te redirigirá a `/login`. Introduce el valor de `APP_PASSWORD` que has definido en `.env`.

### Datos de prueba (opcional)

```bash
pnpm db:seed
```

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión Postgres. Ejemplo: `postgresql://user:pass@host/db?sslmode=require` |
| `APP_PASSWORD` | Contraseña única para entrar en la app. Es la contraseña que el usuario teclea en el login. |
| `SESSION_SECRET` | Secreto aleatorio (mínimo 32 caracteres) para firmar la cookie de sesión. Genéralo con `openssl rand -base64 48`. |

### ¿Cómo creo la primera contraseña?

No hay registro: sólo defines el valor de `APP_PASSWORD` en tu `.env` (o como variable de entorno en Vercel) y eso es la contraseña. Para cambiarla, edita la variable y vuelve a desplegar / reinicia el servidor.

## Despliegue en Vercel + Neon

1. **Crea la base de datos en Neon** (gratis):
   - Entra a [neon.tech](https://neon.tech) → crea un proyecto.
   - Copia el `Connection string` (modo *pooled*, con `sslmode=require`).

2. **Sube el repo a GitHub** y conéctalo a Vercel:
   - [vercel.com/new](https://vercel.com/new) → Import Git Repository.
   - Framework: Next.js (autodetectado).
   - Build Command: `pnpm build`.
   - Output: por defecto.

3. **Configura las variables de entorno** en Vercel
   (Settings → Environment Variables, todas en *Production*, *Preview* y *Development*):
   - `DATABASE_URL` → la cadena de Neon.
   - `APP_PASSWORD` → la contraseña que quieras usar.
   - `SESSION_SECRET` → genera con `openssl rand -base64 48`.

4. **Crea las tablas en Neon** desde tu máquina local (una sola vez):

   ```bash
   DATABASE_URL='postgresql://...neon...?sslmode=require' pnpm db:push
   ```

5. **Despliega**: en Vercel pulsa *Deploy*. Cuando termine, abre la URL desde tu móvil → `Compartir → Añadir a pantalla de inicio` (iOS) o el banner de instalación (Android Chrome).

> También puedes usar la integración Marketplace de Vercel (Neon o Supabase). Las credenciales se inyectan automáticamente como `DATABASE_URL`.

## Scripts

```bash
pnpm dev          # Desarrollo
pnpm build        # Build producción
pnpm start        # Servir build
pnpm typecheck    # Validar TypeScript
pnpm lint         # ESLint

pnpm db:generate  # Generar migraciones SQL desde el schema
pnpm db:push      # Aplicar el schema directamente (recomendado en dev)
pnpm db:studio    # Drizzle Studio (cliente visual)
pnpm db:seed      # Insertar datos de prueba
```

## Estructura

```
/app
  /(auth)/login        Pantalla de login
  /(app)               Rutas protegidas (dashboard, ovejas, conejas, finanzas, más)
    layout.tsx         Verifica sesión + bottom nav + FAB
/actions               Server Actions (auth, ...)
/components
  /ui                  Componentes base estilo shadcn
  /nav                 Bottom nav y FAB
/db
  schema.ts            Esquema Drizzle completo (todas las tablas)
  seed.ts              Datos de prueba opcionales
/lib
  auth.ts              Sesión por cookie HMAC firmada
  utils.ts             Formatos (fecha es-ES, EUR, kg)
  /db                  Cliente Drizzle
proxy.ts               Protege todo excepto /login y assets (Next.js Proxy)
public
  manifest.webmanifest Manifest PWA
  /icons               Iconos (SVG)
  sw.js                Service worker mínimo (sólo para instalabilidad)
```

## Notas técnicas

- **Sesión**: cookie httpOnly firmada con HMAC-SHA256 (Web Crypto). No usamos JWT ni dependencias adicionales.
- **PWA**: en este proyecto evitamos `next-pwa` porque su soporte para Next 16 + Turbopack todavía es inestable. Usamos un `manifest.webmanifest` estático y un `sw.js` mínimo registrado sólo en producción. Esto cubre la instalabilidad (Añadir a pantalla de inicio).
- **iOS zoom-on-focus**: los inputs llevan `font-size: 16px` para evitar el zoom automático.
- **Locale**: la UI está fijada en `lang="es"`, las fechas en `dd/MM/yyyy`, la moneda en EUR (`Intl.NumberFormat("es-ES")`).
