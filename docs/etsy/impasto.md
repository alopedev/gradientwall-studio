# Etsy listing — Impasto (acrylic pack)

Publicado el 2026-09-24 · listing `4581611099`.

Textos listos para pegar en el anuncio. Imágenes y ZIPs se regeneran con:

```bash
scripts/etsy-pack.sh acrylic impasto    # 5 ZIPs → etsy-out/impasto/
scripts/etsy-listing/render.sh impasto  # 6 fotos → etsy-out/impasto/listing/
```

## Title (70–100 caracteres, keyword principal en los primeros ~50)

"Impasto" va en portada y descripción, no al inicio del título: nadie lo busca.

Actualizado el 2026-09-27: "10" → "20" para cuadrar con el vídeo y la descripción (10 diseños × móvil + escritorio).

```
Acrylic Paint Wallpaper Bundle, 20 Abstract Textured Backgrounds for Desktop and iPhone, 4K 5K
```

## Description

```
IMPASTO — 20 acrylic paint wallpapers (10 designs × phone + desktop) — thick, glossy brushstrokes in bold and pastel colours.

WHAT YOU GET
• 20 wallpapers: 10 designs, each ready for phone and for desktop
• 10 × desktop — in 4K 3840 × 2160 (monitors, laptops, TV) and 5K 5120 × 2880 (iMac, Studio Display), both included
• 10 × phone — 1320 × 2868 (every modern iPhone and Android), cropped from the same painting
• High-quality JPG, delivered as 5 ZIP files

HOW IT WORKS
1. Purchase and download the ZIP files instantly (Purchases & Reviews in your Etsy account).
2. Unzip on your computer or phone.
3. Set as wallpaper: on iPhone, open the image in Photos → Share → Use as Wallpaper. On Mac, System Settings → Wallpaper → Add Photo. On Windows, right-click the image → Set as desktop background.

PLEASE NOTE
• This is a digital product. No physical item will be shipped.
• Colours may vary slightly between screens.
• For personal use only. Do not resell, share or redistribute.

HOW IT WAS MADE
These wallpapers were created with AI-assisted image generation, then selected, upscaled, cropped and colour-checked by hand by GradientWall.
```

## Listing settings

| Campo | Valor |
|---|---|
| Type | Digital files |
| Who made it | I did |
| What is it | A finished product |
| When was it made | **2020–2026** |
| AI | Marcar **"Created with AI"** / la casilla de uso de IA que muestre el formulario |
| Category | Dibujos e ilustraciones digitales (escribir "wallpaper" y elegir la opción digital) |
| Price | **4,95 €** base → **5,99 €** con IVA (21 %) en la ficha · ≈ 4,09 € netos (desde 2026-09-27; antes 4,99 € = 6,04 € con IVA) |
| Quantity | 999 |
| Files | los 5 ZIP de `etsy-out/impasto/` |
| Photos | las 6 JPG de `etsy-out/impasto/listing/`, en orden (01 = portada) |

## Tags (13, ≤20 caracteres cada uno — límite real de esta tienda)

Frases de varias palabras (long-tail). No repetir la categoría ni el tipo "digital", que ya cuentan como tag.

```
impasto wallpaper, acrylic wallpaper, iphone wallpaper, desktop background, 4k desktop wallpaper, 5k mac wallpaper, lockscreen wallpaper, paint texture art, colorful abstract, aesthetic wallpaper, pastel wallpaper, dark abstract art, gift for art lovers
```

## Attributes

| Atributo | Valor |
|---|---|
| Número de piezas | 5 o más |
| Relación de aspecto | 16:9, 1:2 |
| Orientación | Horizontal |
| Tema | Abstracto y geométrico |

## Materials

```
digital file, JPG
```

## Video

12 s, 1920 × 1440, sin audio, subido el 2026-09-27. Fuente: `videos/etsy-video/` (misma plantilla que Dessau, variable `pack`).
Render: `cd videos/etsy-video && npx hyperframes render . -q high --variables '{"pack":"impasto"}' -o ./renders/impasto.mp4` y recomprimir con `ffmpeg -crf 20` (sale a ~32 MB).
