---
name: geometria-hex
description: Matemática del tablero hexagonal del prototipo — coordenadas axiales y cúbicas, vecinos, distancia, caminos con hexágonos bloqueados, línea de centro a centro y línea de visión con regla del borde, y conversión a píxeles para SVG. Usar al implementar o depurar src/engine/hex.js, movimiento, rango, LoS, retroceso o el dibujado del tablero.
---

# Geometría hexagonal

Orientación: **punta arriba** (pointy-top). Coordenadas **axiales** `(q, r)`.
Referencia conceptual: el estándar de Red Blob Games, adaptado a las reglas del juego.

## Conversión axial ↔ cúbica

```js
const aCubica = ({ q, r }) => ({ x: q, y: -q - r, z: r });
```
Toda la matemática difícil (distancia, línea, redondeo) se hace en cúbicas y se vuelve a axial.

## Vecinos

```js
const DIRECCIONES = [
  { q: +1, r: 0 }, { q: +1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: +1 }, { q: 0, r: +1 },
];
```
Los seis vecinos están a distancia 1. Adyacente = distancia 1 = Rango 1.

## Distancia

```js
function distancia(a, b) {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}
```

La distancia **ignora** hexágonos bloqueados y ocupados: es medición pura. El bloqueo afecta al
movimiento y a la LoS, que se evalúan por separado. Confundir estas tres cosas es el error más
común en este módulo.

## Caminos y movimiento

Búsqueda en anchura (BFS) desde el origen, expandiendo solo a vecinos **libres**: no bloqueados
y no ocupados por ninguna unidad, amiga o enemiga. El destino también debe estar libre.

- Alcanzables = todos los hexágonos a los que existe camino libre de longitud ≤ Movimiento.
- Un destino a distancia 2 puede ser inalcanzable con Movimiento 3 si el rodeo cuesta 4 pasos.
  Eso es correcto y hay un escenario del backlog que lo verifica.

## Línea de centro a centro

Interpolación en cúbicas y redondeo:

```js
function lerpCubica(a, b, t) { /* interpola x, y, z */ }
function redondearCubica(c) { /* redondea y corrige el eje de mayor error */ }
function linea(a, b) {
  const n = distancia(a, b);
  return Array.from({ length: n + 1 }, (_, i) => redondearCubica(lerpCubica(a, b, i / n)));
}
```

## Línea de visión y la regla del borde

Regla del juego: la línea se traza de centro a centro; si atraviesa un hexágono bloqueado u
**ocupado** está obstruida, pero si solo toca el **borde**, no obstruye.

Implementación: trazar **dos** líneas con un desplazamiento mínimo opuesto (±ε, típicamente
1e-6 sobre las coordenadas cúbicas del origen y el destino). Cuando la línea real pasa justo por
un borde, cada versión cae de un lado distinto.

```js
function hayLoS(estado, origen, destino) {
  const a = lineaConEpsilon(origen, destino, +1e-6);
  const b = lineaConEpsilon(origen, destino, -1e-6);
  const obstruye = (c) => esBloqueado(estado, c) || estaOcupado(estado, c);
  const corta = (linea) => linea.slice(1, -1).some(obstruye);
  return !(corta(a) && corta(b));   // obstruido solo si AMBAS cortan
}
```

Puntos finos, todos con escenario en `docs/features/02-tablero.feature`:

- El **origen y el destino se excluyen** del chequeo: la unidad no se tapa a sí misma ni tapa a
  su objetivo.
- Las unidades intermedias obstruyen sean amigas o enemigas.
- Rozar el borde de un bloqueado **no** obstruye.

## Retroceso tras perder un intercambio

Decisiones D-06 y D-07 de la skill `reglas-escaramuza`:

1. Calcular el vecino del atacante en la dirección **opuesta** al defensor.
2. Si está libre, retroceder ahí.
3. Si no, elegir entre los vecinos libres el que quede a **mayor distancia** del defensor.
4. Si no hay ninguno libre, el atacante se queda donde está.

En los cuatro casos el atacante queda **Stunned**. El retroceso no consume PO ni incrementa el
contador de acciones.

## Píxeles para el SVG

```js
function aPixel({ q, r }, tamaño) {
  return {
    x: tamaño * Math.sqrt(3) * (q + r / 2),
    y: tamaño * 1.5 * r,
  };
}
```
Vértices de un hexágono punta arriba: ángulos de 30° + 60°·i, para i de 0 a 5.
La conversión inversa (píxel a hexágono) se usa solo si se implementa arrastre; con `onClick`
por `<polygon>` no hace falta.

## Trampas conocidas

- Redondear en axial en vez de en cúbicas produce líneas torcidas.
- Usar distancia en lugar de BFS para el movimiento ignora los obstáculos.
- Contar la longitud de la línea con `linea().length` en lugar de `length - 1` desplaza el rango
  en uno: Rango 3 pasa a alcanzar 4 hexágonos.
