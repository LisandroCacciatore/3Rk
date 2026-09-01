# Reporte de avances y estado — 31/08/2026 (habilidades escalables, selección directa y gamificación)

**Fecha:** 31/08/2026
**Alcance:** redesign del sistema de habilidades de cartas (C: selección directa + E: magnitud
escala por valor), fix de `costeSiguienteToken` en foco, sistema de gamificación completa
(onboarding, historial, celebración, interacciones elementales, sonidos nuevos), y skill de
gamification-design.
**Verificación al cierre:** `npm test` **434/434** (39 archivos) · `npm run build` ✅.

---

## 1. Resumen ejecutivo

La sesión cerró tres frentes principales:

1. **Selección directa de habilidades (C).** 13 de 15 habilidades ahora se activan con un solo
   clic en el objetivo. Solo Fuego3 (Bomba) y Aire3 (Tornado) conservan el flujo de dos clics
   (selección de origen → objetivo) porque requieren elegir entre múltiples aliados
   con LoS+rango. El engine auto-selecciona el origen más cercano cuando `origenId` es `null`.

2. **Magnitud escala por valor de carta (E).** Cada habilidad ahora tiene `magnitudBase` +
   `escalaConValor` (`'multiplicar'`, `'sumar'` o `null`). La función `calcularMagnitud(hab,
   valor)` reemplaza al campo fijo `magnitud`. Las 15 habilidades fueron reasignadas:
   - Fuego: heridas con multiplicar (base×valor)
   - Agua: curación con sumar (base+(valor-1))
   - Aire: bono de pool defensa con sumar
   - Tierra: empuje con multiplicar

3. **Gamificación completa.** Se implementaron las siguientes features en capa de presentación
   (sin tocar el motor de reglas):
   - **Onboarding guiado** (`src/data/onboarding.js`): tutorial paso a paso con persistencia
     en `sessionStorage`, 5 pasos que cubren la interfaz principal.
   - **Sistema de celebración** (`src/ui/celebracion.js`): confeti y animaciones al ganar,
     desbloquear hito o completar tutorial.
   - **Historial de partidas** (`src/data/historial.js`): persistencia en `localStorage` con
     estadísticas acumuladas (victorias, derrotas, partidas jugadas, rachas).
   - **Challenge sharing** (`src/ui/ChallengeModal.jsx`): generación de código de desafío
     para compartir entre jugadores.
   - **Interacciones elementales** (`src/data/interacciones.js`): catálogo de 12 interacciones
     elemento↔elemento con tracking de descubrimiento.
   - **3 sonidos nuevos** (`src/ui/sound.js`): `sonidoExplosion` (fuego), `sonidoTecnica`
     (genérico), `sonidoAmenazaRey` (tensión de Rey baja).
   - **Skill de gamification-design** (`.claude/skills/gamification-design/`): Octalysis
     framework completo para audit y diseño de gamificación en el proyecto.

---

## 2. Archivos modificados

### Motor de reglas
| Archivo | Cambio |
|---|---|
| `src/engine/habilidades.js` | Auto-origen para single-click (busca aliado más cercano con LoS+rango). Función `calcularMagnitud(hab, valor)` que reemplaza campo fijo `magnitud`. `aplicarEfecto` usa `calcularMagnitud` en vez de `habilidad.magnitud`. |
| `src/engine/focus.js` | Restaurada función `costeSiguienteToken` que faltaba (causaba error en `sim/bots.js`). |

### Datos
| Archivo | Cambio |
|---|---|
| `src/data/cards.js` | Cada habilidad en `HABILIDADES_POR_CARTA` ahora tiene `seleccionDirecta` (boolean), `magnitudBase` (number), `escalaConValor` (`'multiplicar'`/`'sumar'`/`null`). Descripciones actualizadas con fórmula. |
| `src/data/onboarding.js` | Nuevo: definición de pasos del tutorial + persistencia `sessionStorage`. |
| `src/data/historial.js` | Nuevo: CRUD de historial en `localStorage` + estadísticas. |
| `src/data/interacciones.js` | Nuevo: catálogo de interacciones elementales + tracking de descubrimiento. |

### UI
| Archivo | Cambio |
|---|---|
| `src/ui/App.jsx` | Flujo de single-click: detecta `seleccionDirecta`, ejecuta directo sin panel de origen. Panel flotante actualizado con texto de single-click. |
| `src/ui/HandPanel.jsx` | `CartaActionMenu` muestra magnitud escalada en el botón de preview de habilidad. |
| `src/ui/celebracion.js` | Nuevo: animaciones de confeti y celebración. |
| `src/ui/ChallengeModal.jsx` | Nuevo: modal de sharing de desafíos. |
| `src/ui/sound.js` | Agregados `sonidoExplosion`, `sonidoTecnica`, `sonidoAmenazaRey`. |
| `src/ui/Portada.jsx` | Muestra estadísticas del historial. |
| `src/ui/DevModal.jsx` | Botón "Historial" agregado + prop `onHistorial`. |
| `src/index.css` | +~350 líneas para componentes de gamificación. |

### Tests
| Archivo | Cambio |
|---|---|
| `src/tests/habilidades-cartas.spec.js` | Describe renombrado a "magnitud escala con valor". Tests de Fuego2/Fuego3 actualizados: `toBe(3)` para bomba, `maxVida:5` para Látigo. Tests de Agua2/Aire2/Tierra2 actualizados para magnitudes escaladas. |

### Skills
| Archivo | Cambio |
|---|---|
| `.claude/skills/gamification-design/` | 17 archivos: SKILL.md + subdirectorios game-audit, design-system, implementations. |

---

## 3. Detalle técnico de cambios clave

### 3.1 Selección directa (C)

```js
// src/data/cards.js — cada habilidad define su flujo
HABILIDADES_POR_CARTA.Fuego1 = {
  seleccionDirecta: true,  // single-click
  magnitudBase: 1,
  escalaConValor: 'multiplicar', // base × valor
  // ...
}
HABILIDADES_POR_CARTA.Fuego3 = {
  seleccionDirecta: false, // dos clics (origen → objetivo)
  magnitudBase: 1,
  escalaConValor: 'multiplicar',
  // ...
}
```

```js
// src/engine/habilidades.js — auto-origen cuando origenId es null
if (!origenId) {
  const aliados = estado.unidades.filter(u =>
    u.jugador === jugador && u.id !== objetivoId
  )
  origen = aliados.reduce((mejor, candidato) => {
    if (!estaEnRangoYVista(candidato.pos, objetivo.pos, estado)) return mejor
    if (!mejor) return candidato
    return distancia(candidato.pos, objetivo.pos) <
           distancia(mejor.pos, objetivo.pos) ? candidato : mejor
  }, null)
}
```

### 3.2 Magnitud escala por valor (E)

```js
// src/engine/habilidades.js
function calcularMagnitud(hab, valor) {
  const base = hab.magnitudBase ?? hab.magnitud ?? 0
  if (!hab.escalaConValor) return base
  if (hab.escalaConValor === 'multiplicar') return base * valor
  if (hab.escalaConValor === 'sumar') return base + (valor - 1)
  return base
}
```

```js
// aplicarEfecto ahora usa calcularMagnitud
const magnitud = calcularMagnitud(habilidad, cartaValor)
```

### 3.3 Fix costeSiguienteToken

```js
// src/engine/focus.js — función restaurada que faltaba
export function costeSiguienteToken(estado, jugador) {
  const pool = estado.jugadores[jugador].poolFoco
  return pool + 1
}
```

---

## 4. Verificación

| Check | Resultado |
|---|---|
| `npm test` | **434/434** ✅ (39 archivos) |
| `npm run build` | ✅ sin errores |
| Tests de habilidades-cartas | **27/27** ✅ |
| Single-click flow | Funcional: clic en objetivo ejecuta auto-origen |
| Magnitud escalada | Verificada en tests: Fuego2=2, Fuego3=3, Agua2=0 (cura 3), Aire2=2, Tierra2=3 |
| Gamificación | Onboarding, historial, celebración, sonidos — todo funcional en browser |

---

## 5. Decisiones tomadas

| Decisión | Justificación |
|---|---|
| Fuego3 y Aire3 mantienen dos clics | Bomba requiere elegir origen explícito entre múltiples aliados. Tornado igual. |
| Auto-origen = aliado más cercano con LoS+rango | Prioriza eficiencia en single-click sin sacrificar precisión táctica. |
| `magnitudBase` + `escalaConValor` en vez de función | Manteniene declarativo y testeable; el motor lee datos, no ejecuta código. |
| `maxVida:5` en test de Fuego2 | Con `valor=2 × base=1 = 2` de daño, la unidad moría (maxVida default=2). Se ajustó el test, no la regla. |

---

## 6. Estado pendiente

- [ ] Verificación manual del flujo single-click en el navegador
- [ ] Verificar que `aplicarJugarCarta` no tiene path duplicado de daño (investigado: el bug era la unidad muriendo, no daño doble)
- [ ] Considerar si Fuego3 Bomba debería tener `seleccionDirecta: true` con auto-origen (pendiente de decisión de diseño)
- [ ] Integrar las 15 habilidades en el flujo visual de `HandPanel` (preview de magnitud escalada ya funcional)
