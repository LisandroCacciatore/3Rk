# Guía de assets — Escaramuza (beta de interfaz)

Arte en **16-bit pixel art** estilo JRPG táctico clásico (Final Fantasy Tactics / Breath
of Fire 3). El mapeo de facciones sigue al motor: **A = Fuego = Clan Husky** (negro y
rojo), **B = Agua = Clan Poodle** (blanco, rosa y dorado).

⚠️ La guía de prompts puede etiquetar "Facción A/B" distinto; acá **el nombre del archivo
determina la facción del motor**. `fuego_*.png` son los Husky, `agua_*.png` los Poodle.

## Convención de archivos

PNG con **fondo transparente** en `public/assets/units/`, registrados en `src/ui/assets.js`.
Si el archivo falta, la unidad se dibuja con su glifo SVG de placeholder (fallback).

| Archivo | Facción | Arquetipo |
|---|---|---|
| `fuego_peon.png` … `fuego_rey.png` | Fuego (jugador A, #e94560) · Husky | 6 arquetipos |
| `agua_peon.png` … `agua_rey.png` | Agua (jugador B, #3498db) · Poodle | 6 arquetipos |
| `tierra_peon.png` … `tierra_rey.png` | Tierra (#27ae60) · Akita | 6 arquetipos |
| `aire_peon.png` … `aire_rey.png` | Aire (#f39c12) · Shiba | 6 arquetipos |

Las métricas de colocación (`cx`, `bottom`, `escala`) de `src/ui/sprites.js` se
generan con `node scripts/medir-bbox.mjs` (usa `pngjs`, devDependency). Al
reemplazar cualquier sprite, re-medir y actualizar ese archivo.

Requisitos de exportación:

- PNG **transparente** (el "white background" del prompt es solo para el generador; hay
  que quitarle el fondo al exportar).
- Fuente **128×128 px** (potencia de 2), personaje de pie, **pies cerca del borde inferior**,
  cabeza con margen arriba. La beta escala la caja del sprite a ~34×36 px, así que se
  aceptan fuentes cuadradas mayores (p. ej. 500×500) sin problema.
- La beta los muestra a ~34 px con `image-rendering: pixelated`; el sprite se para sobre un
  anillo de facción con sombra elíptica (estilo FFT).

## Prompt base (Style DNA)

Agregar al final de cada prompt de unidad:

```
16-bit pixel art sprite, JRPG tactical character sprite, standing full body pose,
Breath of Fire 3 style, Final Fantasy Tactics sprite, anthro canine samurai warrior,
feudal japan fantasy, clean white background, pixelated detail, 2d game character asset
--no outline box, photo, 3d, realistic, frame, border --ar 1:1
```

## Fuego (A) — Clan Husky · negro y rojo

- **Peón** (asígaru): `16-bit pixel art sprite, anthro black husky samurai soldier, wearing
  black and crimson red lacquered armor, holding a spear, stern standing pose, JRPG sprite`
- **Alfil** (arquero ninja): `16-bit pixel art sprite, anthro black husky archer, dark ninja
  robes with red trim, long bow yumi with arrows, sharp eyes, standing tactical sprite`
- **Torre** (pesada): `16-bit pixel art sprite, anthro dark wolf samurai tank, massive black
  and red heavy armor, horned kabuto helmet, broad katana, defensive standing pose, JRPG sprite`
- **Caballo** (jinete acorazado): `16-bit pixel art sprite, anthro black husky cavalry officer,
  riding an armored dark warhorse, red and black lacquered armor, gleaming katana, tactical sprite`
- **Campeón** (shinobi/ronin): `16-bit pixel art sprite, anthro dark wolf ronin champion, dark
  kimono cloak with crimson lining, red scarf blowing, dual katanas, fierce JRPG hero sprite`
- **Rey** (shōgun oscuro): `16-bit pixel art sprite, anthro dark husky shogun king, ornate black
  and crimson warlord robes, imperial war fan and katana, golden crest helmet, JRPG leader sprite`

## Agua (B) — Clan Poodle · blanco, rosa y dorado

- **Peón** (asígaru ligero): `16-bit pixel art sprite, anthro fluffy white poodle ashigaru,
  pink and white lacquered armor, short yari spear, standing tactical pose, JRPG sprite`
- **Alfil** (arquera): `16-bit pixel art sprite, anthro fluffy white poodle archer, elegant
  white and pink kimono, drawing a yumi bow, bamboo conical hat, standing tactical sprite`
- **Torre** (tanque): `16-bit pixel art sprite, anthro fluffy white poodle heavy samurai tank,
  heavy pink and gold armor with horned kabuto, massive shield, sturdy stance, JRPG sprite`
- **Caballo** (jinete): `16-bit pixel art sprite, anthro white poodle samurai riding a majestic
  white armored horse, pink armor, sashimono banner flag, 16-bit tactical cavalry sprite`
- **Campeón** (ronin élite): `16-bit pixel art sprite, anthro white poodle elite ronin champion,
  ceremonial pink kimono with floral sakura, dual katanas, dynamic standing pose, JRPG hero sprite`
- **Rey** (daimyō): `16-bit pixel art sprite, anthro white poodle noble daimyo king, luxurious
  pink and gold ceremonial robes, ancient magic scroll and ornate staff, royal kabuto, JRPG leader`

## Mapa y UI (fases posteriores)

- **Fondo del tablero**: `hand-drawn tactical RPG map, aged parchment texture, feudal japan
  fantasy map, japanese ink wash, cherry blossom trees, torii gate, top-down strategy background --ar 16:9`
- **Tile prado**: `top-down 2d game asset, hexagonal terrain tile, japanese zen garden grass,
  subtle cherry blossom petals, ink parchment outline, tactical map tile --ar 1:1`
- **Tile bloqueado**: `top-down 2d game asset, hexagonal terrain tile, impassable japanese mossy
  stone ruins and dense bamboo grove, hand-drawn parchment style, clean borders --ar 1:1`
- **Íconos elementales / Stunned / Muro / marco de carta**: juegos de íconos UI en 16-bit o
  vector con fondo oscuro, un archivo por estado (`assets/estados/stunned.png`, `muro.png`).

## Cartas (D-24/D-25, US-160/161)

PNG con fondo transparente en `public/assets/cartas/`, registrados en `ASSETS_CARTAS`
(`src/ui/assets.js` → `assetCarta(elemento)`). Si el archivo falta, la carta dibuja su
cresta SVG (fallback). El borde lo pone la UI; el PNG es solo el arte interior.

| Archivo | Elemento | Motivo visual |
|---|---|---|
| `fuego.png` | Fuego | llama / incendio, rojo-naranja |
| `agua.png` | Agua | ola / ondulación, azul-cian |
| `aire.png` | Aire | ráfaga / plumas, celeste-gris |
| `tierra.png` | Tierra | montaña / roca, oliva-marrón |
| `vacio.png` | Vacío | grieta / eclipse, púrpura-negro |

Prompt base (agregar al final del prompt):

```
16-bit pixel art elemental card art, JRPG strategy game card, centered elemental emblem,
crisp pixel texture, white clean background, 16-bit rpg asset --no border, frame, text --ar 2:3
```

Un prompt por elemento (p. ej. `flaming crimson phoenix emblem` para Fuego,
`gentle blue water wave coil` para Agua).

## Tiles de terreno (Fase A, D-25)

PNG top-down hex en `public/assets/tierras/`, consumidos por `assetTerreno(tipo)` en
`src/ui/terrenoImagen.js` (map de rutas + fallback). Hasta que el PNG exista, el
tile se dibuja con sus gradientes/decorado SVG (estilo FFT). En modo inmersivo el
`<image>` se recorta con `<clipPath>`/`<path>` (origen trasladado a cada hex) sin
alterar el conteo de `<polygon>` (150) de los tests; en modo esquemático no se
monta y siguen las letras del terreno.

| Archivo | Tipo | Motivo visual |
|---|---|---|
| `prado.png` | prado | jardín zen, pasto verde con pétalos sakura |
| `bosque.png` | bosque | dosel denso de copas verdes, sendero |
| `agua.png` | agua | río ondulado azul-cian con reflejos |
| `montaña.png` | montaña | desfiladero rocoso gris con nieve |
| `camino.png` | camino | camino de tierra apisonado con surcos |
| `puente.png` | puente | puente de madera arqueado sobre agua calma |
| `empalizada.png` | empalizada | valla de palos/palizada japonesa sobre pasto |
| `ruina.png` | ruina | restos de muralla/pagoda musgosa |
| `bloqueado.png` | bloqueado | roquedal + bambú denso, infranqueable |

Prompts para los tiles que faltan (mismo estilo base que el resto):

- **Puente**: `top-down 2d game asset, hexagonal terrain tile, wooden japanese
  arched bridge crossing calm clear water, mossy railings, hand-drawn parchment
  style, clean borders --ar 1:1`
- **Empalizada**: `top-down 2d game asset, hexagonal terrain tile, japanese
  wooden palisade stockade fence on golden grass, sharp wooden stakes, hand-drawn
  parchment style, clean borders --ar 1:1`

## Integración

`UnitToken.jsx` usa `assetUnidad(faccion, arquetipo)` (de `src/ui/assets.js`). Si el PNG existe
y está registrado, el token dibuja el **sprite parado** sobre el anillo de facción (con
`image-rendering: pixelated`); si no, muestra el glifo SVG de `glifos.jsx`. La identidad nunca
depende solo del arte: banda/anillo de facción, pips de vida y slots de Foco están siempre
presentes.
