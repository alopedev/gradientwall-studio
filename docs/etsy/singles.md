# Etsy listings — fondos sueltos

Un anuncio por pieza, para abrir más búsquedas y llevar tráfico a los packs. Decidido el 2026-09-27:

- Piezas: Impasto 08 · Dessau 01 Kreise, 02 Rot, 04 Gelb. (Impasto 02, 05, 10 descartados: se para en 4.)
- Precio: **2,07 €** base → **2,50 €** con IVA (21 %) en la ficha · ≈ 1,30 € netos.
- Archivos: los 3 JPG de la pieza (móvil, 4K, 5K), sin ZIP.
- Fotos: 3 (portada, pantalla completa, "Want all N?" con el pack). Sin vídeo.
- Se crean con **Duplicar** sobre el anuncio del pack (copia categoría, IA, atributos y ajustes) y se
  cambian título, descripción, etiquetas, precio, fotos y archivos. **Ojo:** la copia arrastra los ZIP
  del pack (el pack entero por 2,50 €), sus fotos, el vídeo y "Número de piezas: 5 o más" → quitarlos / poner 1.

```bash
scripts/etsy-listing/render.sh impasto 08   # → etsy-out/singles/impasto-08/{listing,files}/
```

## Palabras clave (autocompletado de Etsy, 2026-09-27)

Confirmadas: "dark phone wallpaper", "dark iphone wallpaper", "aesthetic phone wallpaper",
"dark abstract wall art", "acrylic paint wall art", "pastel wallpaper digital",
"green abstract wall art digital", "bauhaus wallpaper", "bauhaus wall art".
Los colores solos ("blue wallpaper", "teal wallpaper") sugieren papel pintado de pared: solo como tag de apoyo.
Sin sugerencias: "abstract phone wallpaper", "pastel phone wallpaper", "bauhaus iphone", "colorful phone wallpaper".

## Descripción (plantilla)

Cambiar `{NAME}`, `{LEAD}`, `{PHONE_NOTE}` y `{PACK_LINE}` por pieza.

```
{NAME} — {LEAD} One design, ready for your phone and your desktop.

WHAT YOU GET
• 1 design in 3 files: phone + 4K desktop + 5K desktop
• Phone — 1320 × 2868 (every modern iPhone and Android){PHONE_NOTE}
• 4K desktop — 3840 × 2160 (monitors, laptops, TV)
• 5K desktop — 5120 × 2880 (iMac, Studio Display)
• High-quality JPG, instant download

WANT THE WHOLE SET?
{PACK_LINE} Find it in the GradientWall shop.

HOW IT WORKS
1. Purchase and download the files instantly (Purchases & Reviews in your Etsy account).
2. Save them to your computer or phone.
3. Set as wallpaper: on iPhone, open the image in Photos → Share → Use as Wallpaper. On Mac, System Settings → Wallpaper → Add Photo. On Windows, right-click the image → Set as desktop background.

PLEASE NOTE
• This is a digital product. No physical item will be shipped.
• Colours may vary slightly between screens.
• For personal use only. Do not resell, share or redistribute.

HOW IT WAS MADE
This wallpaper was created with AI-assisted image generation, then selected, upscaled and checked on real phone and desktop screens by hand by GradientWall.
```

- Impasto → `{PHONE_NOTE}` = `, cropped from the same painting` · `{PACK_LINE}` = `This design is part of the IMPASTO pack — 10 acrylic paint designs, each for phone and desktop.`
- Dessau → `{PHONE_NOTE}` = `, composed separately (not cropped)` · `{PACK_LINE}` = `This design is part of the DESSAU pack — 6 Bauhaus designs, each composed for phone and desktop.`

## Impasto 08 (piloto)

Publicado 2026-09-27 · listing `4583520966` (duplicado de Impasto; se quitaron sus ZIPs, fotos y vídeo, y "Número de piezas" → 1).

Título (13 palabras):

```
Dark Phone Wallpaper, Teal Coral Acrylic Paint Art, iPhone and Desktop, 4K 5K
```

`{NAME}` = `IMPASTO 08` · `{LEAD}` = `a dark abstract acrylic wallpaper: thick teal and coral brushstrokes swirling across deep navy.`

Tags:

```
dark phone wallpaper, dark abstract art, teal wallpaper, iphone wallpaper, desktop background, 4k desktop wallpaper, 5k mac wallpaper, lockscreen wallpaper, acrylic wallpaper, paint texture art, dark aesthetic, colorful abstract, impasto wallpaper
```

## Dessau 01 Kreise · 02 Rot · 04 Gelb

Duplicados de Dessau (`4582570095`). Publicados 2026-09-27: Kreise `4583512789` · Rot `4583513091` · Gelb `4583523914`. Palabras clave extra confirmadas: "mid century modern wallpaper",
"minimalist wallpaper", "minimalist phone wallpaper", "geometric wallpaper", "blue aesthetic", "yellow aesthetic",
"red aesthetic wall art", "bauhaus poster blue/yellow".

Títulos (14 palabras):

```
Bauhaus Wallpaper, Blue Mid Century Modern Art, Minimalist Phone and Desktop Background, 4K 5K
Bauhaus Wallpaper, Red Mid Century Modern Art, Minimalist Phone and Desktop Background, 4K 5K
Bauhaus Wallpaper, Yellow Mid Century Modern Art, Minimalist Phone and Desktop Background, 4K 5K
```

`{NAME}` / `{LEAD}`:

- `DESSAU · KREISE` — `a Bauhaus wallpaper in cobalt blue: a vermilion circle, a cream half-moon and one clean diagonal line.`
- `DESSAU · ROT` — `a Bauhaus wallpaper in vermilion red: a mustard circle over a black half-moon, cut by a single white line.`
- `DESSAU · GELB` — `a Bauhaus wallpaper in mustard yellow: a cobalt half-circle and a vermilion dot, crossed by one thin black line.`

Tags — 10 comunes + 3 por color:

```
bauhaus wallpaper, bauhaus art, mid century modern, iphone wallpaper, desktop background, 4k desktop wallpaper, 5k mac wallpaper, lockscreen wallpaper, geometric wallpaper, minimalist wallpaper
01: blue aesthetic, blue wallpaper, bauhaus poster blue
02: red aesthetic, red wallpaper, primary color art
04: yellow aesthetic, yellow wallpaper, primary color art
```
