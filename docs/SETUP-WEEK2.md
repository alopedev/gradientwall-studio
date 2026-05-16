# Setup — Semana 2 (Checkout + entrega de packs)

Esta guía cubre el setup manual de las cuentas externas necesarias para que
la tienda funcione end-to-end. El código ya está implementado y testeado —
solo falta cablearlo a las cuentas reales.

## 0 · Antes de empezar

Necesitarás:

- Acceso al dominio `gradientwall.com` (o al que vayas a usar) — para los
  enlaces del email y para la URL del webhook de Lemon Squeezy.
- 1 wallpaper pack listo a máxima resolución (ej. `midnight-velvet.zip` con
  10 archivos JPG generados con ChatGPT Image / Nano Banana).

## 1 · Lemon Squeezy

1. Crear cuenta en [lemonsqueezy.com](https://lemonsqueezy.com) y completar el setup
   de la **Store** (datos de empresa para la factura, logos, branding del
   checkout). Lemon Squeezy hace de Merchant of Record — gestiona IVA UE.
2. **Products → New Product**:
   - Name: `Midnight Velvet`
   - Type: Single payment
   - Price: `4.99 EUR`
   - **Custom Data** (importante): añadir
     `pack_slug` = `midnight-velvet`
     Este valor llega al webhook y le dice a nuestro backend qué pack ha
     comprado el usuario.
3. **Settings → Webhooks → New Webhook**:
   - URL: `https://<tu-dominio>/.netlify/functions/lemon-squeezy-webhook`
   - Events: marcar **Order created** únicamente
   - Generar y **copiar el Signing Secret** → lo necesitarás como
     `LS_WEBHOOK_SECRET`
4. **Settings → API → New API Key** (para `/recover`):
   - Crear y copiar la key → será `LS_API_KEY`
5. Anota el **dominio de tu store** (ej. `gradientwall.lemonsqueezy.com`) →
   será `VITE_LEMONSQUEEZY_STORE`
6. **Variant ID del producto**: ve al producto creado → la URL del checkout
   tiene la forma `/buy/<variant-id>`. Anota ese ID y añádelo al manifest
   `src/data/packs.json` en el campo `lemonSqueezyVariantId` del pack
   `midnight-velvet`.

## 2 · Loops

1. Crear cuenta en [loops.so](https://loops.so).
2. **Transactional → New Email**:
   - Template name: `Your pack is ready`
   - Asunto: `Your ${packName} pack is ready ↓`
   - Body: usa las dos data variables disponibles:
     - `{{packName}}` — slug del pack (más adelante lo cambiamos a nombre legible)
     - `{{downloadUrl}}` — link absoluto al endpoint de descarga
   - Tras guardar, **copia el Transactional ID** → será `LOOPS_TRANSACTIONAL_ID`
3. **Settings → API → Generate API Key** → será `LOOPS_API_KEY`

## 3 · Cloudflare R2

1. Cloudflare dashboard → **R2 Object Storage → Create bucket**
   - Name: `gw-packs`
   - Location: Auto / Eastern North America (o la más cercana)
   - **Mantener privado** (no exponer público — el acceso es vía presigned URL)
2. **R2 → Manage R2 API Tokens → Create Token**:
   - Permissions: Object Read & Write para el bucket `gw-packs`
   - Anotar **Access Key ID**, **Secret Access Key**, **Account ID**
3. **Subir el pack**: usa el dashboard, `wrangler r2`, o un cliente S3
   (Cyberduck) para subir el ZIP a la ruta:
   ```
   gw-packs/packs/midnight-velvet/midnight-velvet.zip
   ```
   La función `download` espera exactamente esa ruta — la genera con
   `packZipKey(slug)` que es `packs/{slug}/{slug}.zip`.

## 4 · Netlify

1. Conectar el repo (Add new site → Import from Git → seleccionar GradientWall).
2. **Build settings** (deberían autodetectarse del `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. **Site settings → Environment variables** — añadir todas las del `.env.example`:
   - `VITE_LEMONSQUEEZY_STORE`, `PUBLIC_SITE_URL`, `JWT_SECRET`,
     `LS_WEBHOOK_SECRET`, `LS_API_KEY`, `LOOPS_API_KEY`,
     `LOOPS_TRANSACTIONAL_ID`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
     `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_PACKS`
4. Generar `JWT_SECRET` con `openssl rand -hex 32` y pegarlo.
5. **Deploy**.

## 5 · Validación E2E

Una vez todo en producción (o deploy preview):

1. Abrir `/packs/midnight-velvet` → el botón **Buy** debe estar habilitado.
2. Click → overlay LS → pagar con tarjeta de test `4242 4242 4242 4242`,
   cualquier fecha futura, cualquier CVC.
3. **Email**: revisar la bandeja del email usado en checkout. Debería llegar
   en <30s con el link de descarga.
4. Click en el link → el ZIP debe descargarse.
5. Repetir el click 5 veces → la 6ª descarga debe devolver 403 con
   `reason: "exhausted"`.
6. Probar `/recover` con el email + `Order ID` del recibo de LS → debería
   reenviar el link.

## Troubleshooting

- **Webhook no llega**: en LS → Webhooks → click en tu webhook → ver
  "Recent deliveries" y reintenta manualmente. Confirma que la URL apunta a
  un dominio HTTPS válido.
- **Email no llega**: revisar logs de Loops (Loops → Activity). Si aparece
  como enviado pero no llega, revisar carpeta spam del email destino.
- **Download devuelve 403 not_found**: confirmar que el order pasó por el
  webhook (logs de Netlify Function). Si el webhook falló, no hay registro
  en Blobs y el download no encuentra el order.
- **Download devuelve 500**: probable problema con credenciales R2 o nombre
  del bucket. Verificar env vars exactas.
