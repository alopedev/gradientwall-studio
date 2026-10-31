# Etsy listing — Marble (liquid marble pack, no AI)

Pendiente de publicar (2026-10-31) · listing id: —

Primer pack dibujado por el motor v2 del Studio, no por IA. Las 12 piezas son looks fijadas en
`src/lib/packs/engine-packs.ts` (dirección D "Marble", elegida por Àlex el 2026-10-31 entre 6). Se
renderizan a cada tamaño de forma nativa, sin Upscayl:

```bash
npm run dev                                   # en otra terminal
node scripts/render-engine-pack.mjs marble    # 36 JPG + 3 ZIPs → etsy-out/marble/ (~4 min)
scripts/etsy-listing/render.sh marble         # 6 fotos → etsy-out/marble/listing/ (Mac)
```

| Nº | Pieza | Nº | Pieza |
|---|---|---|---|
| 01 | Terracotta | 07 | Jade |
| 02 | Olive | 08 | Lavender |
| 03 | Slate Blue | 09 | Apricot |
| 04 | Rose Clay | 10 | Navy and Gold |
| 05 | Graphite | 11 | Walnut |
| 06 | Ochre | 12 | Sienna |

## Title

Keyword principal ("marble wallpaper") al principio. Sin validar aún en el autocompletado de Etsy: revisarlo al
publicar, como se hizo con Dessau.

```
Marble Wallpaper Pack, Liquid Marble iPhone Wallpaper, Phone & Desktop 4K 5K (Digital Download)
```

## Description

```
MARBLE — 24 liquid marble wallpapers (12 designs × phone + desktop) — soft swirls of terracotta, olive, slate blue, rose clay, jade, ochre and more, each with a calm cream light.

Every design is drawn by GradientWall's own gradient engine and rendered natively at each size, so the desktop files are as sharp as the phone ones. No AI image generation.

WHAT YOU GET
• 24 wallpapers: 12 designs, each composed for phone and for desktop (not cropped)
• 12 × phone — 1320 × 2868 (every modern iPhone and Android)
• 12 × desktop — in 4K 3840 × 2160 (monitors, laptops, TV) and 5K 5120 × 2880 (iMac, Studio Display), both included
• High-quality JPG, delivered as 3 ZIP files

HOW IT WORKS
1. Purchase and download the ZIP files instantly (Purchases & Reviews in your Etsy account).
2. Unzip on your computer or phone.
3. Set as wallpaper: on iPhone, open the image in Photos → Share → Use as Wallpaper. On Mac, System Settings → Wallpaper → Add Photo. On Windows, right-click the image → Set as desktop background.

PLEASE NOTE
• This is a digital product. No physical item will be shipped.
• Colours may vary slightly between screens.
• For personal use only. Do not resell, share or redistribute.

HOW IT WAS MADE
Designed by GradientWall with its own code-based gradient engine (the same one behind the free studio at gradientwall.app). Colours, composition and every design were chosen by hand. No AI was used.
```

## Listing settings

| Campo | Valor |
|---|---|
| Type | Digital files |
| Who made it | I did |
| What is it | A finished product |
| When was it made | **2020–2026** |
| AI | **No** marcar "Created with AI" (a diferencia de Impasto y Dessau) |
| Category | Dibujos e ilustraciones digitales (igual que Dessau) |
| Price | **4,95 €** base → **5,99 €** con IVA (21 %), como los otros packs |
| Quantity | 999 |
| Files | los 3 ZIP de `etsy-out/marble/` (4K ≈ 10 MB, 5K ≈ 18 MB, móvil ≈ 5 MB; límite 20 MB) |
| Photos | las 6 JPG de `etsy-out/marble/listing/`, en orden (01 = portada) |

## Tags (13, ≤20 caracteres)

Sin validar en el autocompletado de Etsy.

```
marble wallpaper, liquid marble, iphone wallpaper, phone wallpaper pack, desktop background, 4k desktop wallpaper, 5k mac wallpaper, lockscreen wallpaper, abstract wallpaper, earth tone aesthetic, neutral wallpaper, marble aesthetic, wallpaper bundle
```

## Attributes

| Atributo | Valor |
|---|---|
| Número de piezas | 5 o más |
| Relación de aspecto | 16:9, 1:2 (Etsy no ofrece 9:16) |
| Orientación | Vertical |
| Tema | Abstracto |

## Después de publicar

- Apuntar aquí el listing id.
- Web: añadir el pack a `src/data/packs.json` con `etsyUrl` (ficha `/packs/marble/`, indexable en cuanto tiene anuncio). Las vistas previas salen de `etsy-out/marble/`.
