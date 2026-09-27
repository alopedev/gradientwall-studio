# Etsy listing — Dessau (Bauhaus pack)

Publicado el 2026-09-25 · listing `4582570095`.

Textos listos para pegar en el anuncio. Imágenes y ZIPs se regeneran con:

```bash
scripts/etsy-pack.sh dessau             # 3 ZIPs → etsy-out/dessau/
scripts/etsy-listing/render.sh dessau   # 6 fotos → etsy-out/dessau/listing/
```

Originales en `public/assets/packs/dessau/`: `NN_<nombre>.png` (móvil, 9:16) y
`NN_<nombre>-desktop.png` (escritorio, 16:9), generados con GPT Image.

| Nº | Pieza | Fondo |
|---|---|---|
| 01 | Kreise | cobalto |
| 02 | Rot | bermellón |
| 03 | Schwarz | negro |
| 04 | Gelb | amarillo |
| 05 | Sonne | bermellón / crema |
| 06 | Halbkreise | cobalto / amarillo |

## Title (70–100 caracteres, keyword principal en los primeros ~50)

"Dessau" (ciudad de la escuela Bauhaus) va en portada y descripción, no al inicio del título: nadie lo busca.
Frases elegidas con el autocompletado de Etsy (2026-09-25): "bauhaus wallpaper", "phone wallpaper pack",
"iphone wallpaper aesthetic", "mid century modern art". "bauhaus phone" solo sugiere fundas; 13 palabras
(guía de ≤14). "4K 5K" queda en tags y descripción.

Actualizado el 2026-09-27 con la recomendación de título de Etsy (Visibilidad en la búsqueda). Anterior:
`Bauhaus Wallpaper Pack, Phone and Desktop, Mid Century Modern Art, iPhone Wallpaper Aesthetic`.

```
Bauhaus Dessau Wallpaper Pack, Mid-Century Modern Art, Phone & Desktop (Digital Download)
```

## Description

```
DESSAU — 12 Bauhaus modern wallpapers (6 designs × phone + desktop) — bold circles, clean lines and flat colour fields in cobalt, vermilion, mustard and black.

Named after the city of the Bauhaus school, each design follows its rules: asymmetric balance, a few strong shapes, and plenty of calm space so your clock and icons stay easy to read.

WHAT YOU GET
• 12 wallpapers: 6 designs, each composed separately for phone and for desktop (not cropped)
• 6 × phone — 1320 × 2868 (every modern iPhone and Android)
• 6 × desktop — in 4K 3840 × 2160 (monitors, laptops, TV) and 5K 5120 × 2880 (iMac, Studio Display), both included
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
These wallpapers were created with AI-assisted image generation, then art-directed, selected, upscaled and checked on real phone and desktop screens by hand by GradientWall.
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
| Files | los 3 ZIP de `etsy-out/dessau/` |
| Photos | las 6 JPG de `etsy-out/dessau/listing/`, en orden (01 = portada) |

## Tags (13, ≤20 caracteres cada uno — límite real de esta tienda)

Frases de varias palabras (long-tail). No repetir la categoría ni el tipo "digital", que ya cuentan como tag.

```
bauhaus wallpaper, bauhaus art, mid century modern, iphone wallpaper, desktop background, 4k desktop wallpaper, 5k mac wallpaper, lockscreen wallpaper, geometric wallpaper, minimalist abstract, modern art gift, wallpaper bundle, phone wallpaper pack
```

## Attributes

| Atributo | Valor |
|---|---|
| Número de piezas | 5 o más |
| Relación de aspecto | 16:9, 1:2 (Etsy no ofrece 9:16) |
| Orientación | Vertical |
| Tema | Abstracto y geométrico |

## Materials

No aplica: en esta categoría es una lista cerrada de materiales físicos. El formulario tampoco pide "When was it made".

## Video

12 s, 1920 × 1440, sin audio, subido el 2026-09-27. Fuente: `videos/etsy-video/` (HyperFrames: Three.js + GSAP).
Render: `cd videos/etsy-video && npx hyperframes render . -q high --variables '{"pack":"dessau"}' -o ./renders/dessau.mp4`.
