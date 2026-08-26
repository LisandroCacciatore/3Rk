# Pendientes de decisión — 05/08/2026

**Fecha:** 05/08/2026
**Propósito:** lista de problemas abiertos que necesitan decisión del dueño, cada uno con
evidencia, opciones de solución y recomendación. Completar el campo **Decisión** de cada
ítem y lo implementamos.
**Documentos hermanos:** `2026-08-04-informe-situacion.md`, `2026-08-04-reporte-trabajo.md`,
`2026-08-04-fases2-4-simulacion-watchpoints.md`, `BACKLOG.md`.

---

## 1. Contexto

El MVP está **implementado al ~100%** (11/11 épicas, 49/49 historias, 17 files / 237 tests en
verde, build OK). Pero el **objetivo real del MVP — validar el núcleo táctico por playtest —
está en ~65%**: el juego funciona y se juega, pero la Etapa 11 (3000 partidas simuladas)
encontró 5 hallazgos de balance que impiden que exista una *partida completa*.

> Nota importante: las simulaciones de la Etapa 11 se corrieron con **robo por turno = 1**.
> Hoy aprobaste y apliqué **D-08: robo por turno = 0** (ronda = cada jugador gasta sus 5
> cartas). **Antes de aplicar cualquier ajuste de balance (ítems B–E) conviene re-correr la
> simulación** con el nuevo flujo: los números de H1–H5 pueden moverse.

---

## 2. Hecho hoy — ya aplicado (solo para tu registro)

| Qué | Archivos | Estado |
|---|---|---|
| D-08: robo por turno `1` → `0` (aprobado) | `src/data/rules.js` | ✅ aplicado |
| 2 tests que fijan el nuevo flujo (entrante no roba; ronda termina a las 5 cartas/jugador) | `src/tests/robo.spec.js` | ✅ verde |
| Esquema de carta en toda la mano (color del elemento + símbolo + valor; seleccionada destacada) | `src/ui/HandPanel.jsx`, `src/index.css` | ✅ build OK |
| Trazabilidad de D-08 en el registro de decisiones | `docs/BACKLOG.md` | ✅ |
| A-11-N1: `reyProtegidoRonda1: true` (íten B) | `rules.js`, `index.js`, `selectors.js`, `SettingsPanel.jsx` + tests en `combat.spec.js` | ✅ aplicado |
| A-11-N2: Caballo rango 3, Alfil rango 2 (íten C) | `src/data/archetypes.js` + tests | ✅ aplicado |
| A-11-N3: curva `1/2/3/5` conmutable (íten D) | `rules.js`, `actions.js`, `index.js`, `App.jsx`, `SettingsPanel.jsx`, `sim/bots.js`, `sim/metricas.js` + tests | ✅ aplicado |
| Test dedicado D-17 (tope de cadena por Foco) + fix de expectativa US-030 | `src/tests/combat.spec.js`, `src/tests/actions.spec.js` | ✅ verde |
| Comentario obsoleto de D-23 (F.3) | `docs/features/10-instrumentacion.feature:69` | ✅ corregido |
| Simulación re-corrida con robo=0 + ajustes (F.1) — resultados en §3 B/C/D | `sim/resultados.json`; backups `sim/resultados-robo0-baseline.json`, `sim/resultados-robo1-backup.json` | ✅ 650 partidas |
| A-11-N4 `stunnedDuro` + A-11-N5 `retrocesoDefensorDiferencia2` (íten E) | `rules.js`, `status.js`, `combat.js`, `SettingsPanel.jsx`, `sim/metricas.js`, `sim/correr.js` + tests | ✅ aplicado |
| UI: glifos por arquetipo, carta pulida + resalte, ficha con stats y contadores de Foco, transiciones | `src/ui/glifos.jsx`, `UnitToken.jsx`, `UnitSheet.jsx`, `index.css` | ✅ build OK |
| Ítem A cerrado (era H2) — Foco sin bug | este doc | ✅ |

---

## 3. Decisiones pendientes

> Formato por ítem: **Problema → Evidencia → Opciones → Recomendación → Decisión (a completar)**.

---

### Ítem A — Mecánica de Foco: qué es lo que no funciona

**Problema:** reportaste que "la mecánica de Foco no está funcionando bien", pero no encontré
bug en el motor. Todo lo siguiente está verificado con tests y simulación y funciona según las
reglas congeladas (skill `reglas-escaramuza` y GDD):

- Concentrarse agrega el token y cobra PO (coste escalonado 1º=1, 2º=3, 3º=5). ✔
- Foco lleno bloquea la acción sin consumir PO. ✔
- Concentrarse NO consume paso del contador (D-02, conmutable). ✔
- Pago mixto de Técnicas (tokens guardados + carta del elemento) para Foco menor al coste. ✔

**Hipótesis a descartar (marcá la que viste, o escribí la tuya):**

- [ ] **H-A1 · El token no aparece**: tras concentrar, el token no se refleja en la ficha
      (`UnitSheet`) ni en la miniatura (`UnitToken`). → bug de render, no de regla.
- [ ] **H-A2 · No se puede declarar la técnica**: el botón de la técnica aparece deshabilitado
      o falla incluso teniendo tokens + carta del elemento.
- [ ] **H-A3 · Coste/consumo se siente mal**: el coste 1/3/5 de Concentrarse, o que no consuma
      acción (D-02), no se comporta como esperabas. → posiblemente una decisión de regla, no bug.
- [ ] **H-A4 · Foco se siente inútil**: es probablemente **consecuencia de H2** (el Rey muere en
      ronda 1 y no hay turnos para acumular Foco), no un problema del Foco en sí.

**Evidencia:** `src/tests/focus.spec.js` (18 tests), `src/tests/techniques.spec.js` (pago
mixto), simulación de la Etapa 11 (0.44 tokens / 0.11 técnicas por partida en partidas cortas —
WP-3).

**Recomendación:** no tocar el motor todavía. Confirmar H-A1..A4 o describir el síntoma exacto.
Si es H-A3 o H-A4, es decisión de reglas/balance y va con los ítems B–E.

> **Decisión (dueño):** ✅ **Resuelto (05/08/2026): era H2.** Confirmado por el dueño; no hay bug
> de motor. El Foco "no funcionaba" porque el Rey moría en ronda 1 y no había turnos para
> acumularlo. La simulación post-ajustes (B/C/D + robo=0) lo respalda: el Foco florece cuando la
> partida dura (12–13 tokens en aleatorio/ahorrador vs 0.43 en el rush codicioso). Sin cambios de
> código; el Foco queda cubierto por `src/tests/focus.spec.js` (18 tests).

---

### Ítem B — A-11-N1: cómo se protege al Rey (H2)

**Problema:** el Rey cae en la **ronda 1** y el 87% de las partidas terminan por jaque mate.
No existe "partida completa": Foco, Técnicas, curva y tempo no tienen tiempo de partida para
ser medidos.

**Evidencia:** simulación codicioso/codicioso — partidas p50 = ronda 1.49, muerte del Rey A
ronda 1.44; 87% de victorias por jaque mate (`fases2-4-simulacion-watchpoints.md`, WP-5/H2).
Perfil actual del Rey: Defensa 2g2 (Keep 2), Vida 4 (máximo permitido por FR-061).

**Opciones:**

1. **(Recomendada) Regla conmutable "el Rey no puede ser objetivo de ataque en la Ronda 1"**
   — garantiza mínimo una ronda de partida completa. Nueva flag en `rules.js`, fácil de medir
   y revertir. Es la opción que desbloquea todo lo demás sin tocar el combate.
2. **Retrasar el despliegue del Rey** — moverlo 1 hex atrás en el escenario base. Solo datos,
   sin regla nueva. No garantiza protección contra rango 3 del Alfil.
3. **Subir la Defensa del Rey a 2g3** — rompe FR-062 ("Keep 2 solo en Campeón y Rey"), requiere
   aprobar el cambio de alcance.
4. **Reducir el swing del primer asalto** — tocar explosiones/tope de cadena (D-17). Es más
   profundo y no resuelve el rush directo.

**Recomendación:** opción 1 + re-correr la simulación. Si con robo=0 la muerte en ronda 1
desaparece sola, la regla ni siquiera se necesita.

> **Decisión (dueño):** ✅ **Ejecutada (05/08/2026).** Se aplicó la opción 1: flag conmutable
> `reyProtegidoRonda1: true` en `rules.js`, guard en `aplicarAtacar` (objetivo y 2º objetivo de
> DobleTiro) y filtro en `objetivosAtaque` para que los bots lo respeten. Resultado (sim con
> robo=0 + ajustes de C/D): la muerte del Rey A ya **no ocurre en la ronda 1** (p50 = ronda 3);
> con la protección sola el p50 de muerte es 3 (igual que con robo=0). El 87% de jaque mate en
> codicioso/codicioso persiste en parte por el bot, que prioriza al Rey.

---

### Ítem C — A-11-N2: reequilibrar la plantilla (H1)

**Problema:** la banda **Agua gana 81-95%** sin importar el orden de juego. Es la plantilla,
no el orden.

**Evidencia:** composiciones reales (`src/engine/state.js`):
- **Fuego (A):** Rey, Torre (2g1/2g1, Vida 4, rango 1), Caballo (mov 5, 2g1, rango 1), Peón, Peón.
- **Agua (B):** Rey, **Alfil (2g1, rango 3)**, **Campeón (2g2 Keep 2, rango 2, Foco 3)**, Peón, Peón.

Agua tiene las dos piezas de más valor (alcance 3 + único Keep 2 ofensivo del juego); Fuego tiene
un tanque (Torre) y un veloz melee (Caballo) que no llegan a pelear antes del asalto al Rey.

**Opciones:**

1. **(Recomendada) Subir el Rango del Caballo de Fuego a 3** (`src/data/archetypes.js`, una
   línea) para darle a Fuego una pieza de alcance equivalente al Alfil, y re-medir. No toca
   Keep 2 ni rompe FR.
2. **Bajar el Alfil de Agua a Rango 2** — acerca su alcance al rango 1-2 general. También una línea.
3. **Bajar el Campeón de Agua: ataque 2g2 → 2g1** — más invasivo, pierde el único Keep 2 de ataque.
4. **Reasignar perfiles entre bandas** — simetría total de combos; **viola FR-063** (asimetría).
   Descartado salvo que se apruebe cambiar el alcance.

**Recomendación:** aplicar 1 y 2 juntas (dos líneas en datos), re-correr la simulación y ver si
el gap 8-19% de victoria de A cierra sin perder asimetría.

> **Decisión (dueño):** ✅ **Ejecutada (05/08/2026).** Caballo rango 1→3 y Alfil rango 3→2 en
> `src/data/archetypes.js`. Resultado (sim con robo=0, 300 partidas codicioso/codicioso, 150
> aleatorio/aleatorio): la victoria de A (Fuego) pasó de **8% → 31%** (codicioso) y de **19% →
> 44%** (aleatorio). H1 se cerró de forma sustancial sin tocar Keep 2 ni FR.

---

### Ítem D — A-11-N3: la curva 1/3/5/9 (H3)

**Problema:** nadie paga una 2ª/3ª/4ª acción de la misma unidad. 5 PO y 9 PO = 0 en todas las
configs. El juego se decide por el pool de dados, no por la economía de acciones.

**Evidencia:** con 1 carta obligatoria por turno (valor 1-3 PO) y PO que no persisten entre
turnos (FR-011), el escalón de 3 PO ya exige jugar la carta más cara; la 3ª acción (5 PO) es
inalcanzable en el flujo actual. Con robo=0 (hoy) el techo por turno sigue siendo 3 PO.

**Opciones:**

1. **(Recomendada) Redefinir a `1/2/3/5`** — el 2º escalón baja a 2 PO (alcanzable con cartas
   de 2-3), el 3º a 3 PO (una carta de 3 sola), el 4º queda como hito de 5 PO. Es un cambio de
   un arreglo en `src/data/rules.js`/`actions.js`, conmutable.
2. **Solo bajar el 2º escalón a 2 PO** (`1/2/5/9`) — cambio mínimo para que exista la 2ª acción;
   el 3º sigue teórico.
3. **Aceptar la curva muerta** — dejar 1/3/5/9 y no diseñar contenido en torno a la 3ª/4ª acción.
4. **Ampliar cartas a valor 1-4** — cambia el alcance (cartas 1-3); requiere aprobar FR-004/F.

**Recomendación:** opción 1 (`1/2/3/5`) como flag conmutable y medir cuántas 2ª/3ª acciones
aparecen por partida. Ajustar después según el dato, no a priori.

> **Decisión (dueño):** ✅ **Ejecutada (05/08/2026).** Curva `costesAccion: [1, 2, 3, 5]` en
> `rules.js`; `COSTES_ACCION` eliminado de `actions.js`; todos los call sites pasan `estado.reglas`.
> Resultado (sim post-ajustes): la 2ª acción pasó de **0 → 1.9–4.8 por partida** y la 3ª de **0 →
> 3.4–4.7 por partida** en codicioso/ahorrador y aleatorio. La 4ª acción (5 PO) sigue siendo un
> hito raro (0) — consistente con el diseño.

---

### Ítem E — Stunned y el incentivo a atacar (H5/H4)

**Problema:** dos hallazgos conectados. Defender es más rentable que atacar (H4) y Stunned es un
impuesto bajo, no una decisión (H5). Combinado con H2, premia esperar al rival en vez de jugar.

**Evidencia:** atacante gana <50% en todas las configs salvo hoarding (WP-1); Stunned le cuesta
~10 pp al atacante (WP-6); la variante `stunned-keep` (D-23) apenas lo suaviza.

**Opciones:**

1. **(Recomendada) Stunned más duro + bonus al atacante** — (a) Stunned reduce 1 dado del pool
   **y** 1 del keep (mín 1 dado), como flag nuevo; (b) el atacante que gana por diferencia ≥2
   hace retroceder 1 hex al defensor además de la herida. Re-medir.
2. **Solo Stunned más duro** — aplicar (a) sin tocar el ataque. Más conservador.
3. **Empate favorece al atacante** — hoy gana la defensa (FR-054). Cambia el alcance de reglas
   congeladas; requiere aprobación explícita.
4. **Dejarlo como está** — aceptar un juego reactivo/defensivo.

**Recomendación:** opción 1 con ambas partes como flags independientes, para medir el efecto de
cada una por separado. Prioridad menor que B/C (no tiene sentido medir incentivo a atacar si el
Rey cae en ronda 1).

> **Decisión (dueño):** ✅ **Ejecutada (05/08/2026)** — criterio "como en H3": aplicar la opción
> 1 completa y ajustar según el dato, no a priori. Ambas partes como flags independientes:
> `stunnedDuro` (**A-11-N4**, H5) y `retrocesoDefensorDiferencia2` (**A-11-N5**, H4) en
> `rules.js`, `status.js`, `combat.js` (evento `retroceso-defensor`), tests, panel de reglas y
> variantes de sim (`stunned-duro`, `retroceso-defensor`). **Medición de H4/H5 diferida al
> playtest manual** (por decisión del dueño no se corrió la campaña): reportar
> `tasaAtacanteGlobal` y `atacanteStunned.tasaVictoria` de cada variante cuando se simule.

---

### Ítem F — Pendientes triviales (no requieren diseño, sí manos)

- **F.1 · Re-correr la simulación con robo=0** (D-08 de hoy) antes de tocar balance. ✅ **hecho**
  (baseline robo=0 en `sim/resultados-robo0-baseline.json`; campaña post-ajustes en
  `sim/resultados.json`).
- **F.2 · B.1** — test dedicado para el tope de cadena por Foco (E-1 / D-17). ✅ **hecho**
  (3 tests nuevos en `src/tests/combat.spec.js`: tope = Foco+1, flag apagada = tope fijo 20,
  Peón con dos 10 no encadena una tercera tirada).
- **F.3 · B.2** — comentario obsoleto en `docs/features/10-instrumentacion.feature:69`. ✅ **hecho**
  (D-23 ya está implementado en `src/engine/status.js`).
- **F.4 · Fase 5 de la Etapa 11** — checklist de playtest manual en el navegador (flujo de
  Reflujo en dos pasos, panel de reglas, exportar/reproducir). 🔲 pendiente.

Estos no necesitan tu decisión; F.1–F.3 ya se ejecutaron.

---

## 4. Cómo lo retomo

Ejecutado hoy (05/08/2026), en este orden: **B1 + C1/C2 + D1 + Ítem E (A-11-N4/N5)** — todo el
balance decidido queda como flags conmutables; suite completa en verde (17 files / 237 tests),
build OK y UI pulida para testing manual. Pendientes para el dueño:

1. **F.4 — Fase 5 de la Etapa 11**: checklist de playtest manual en el navegador (flujo de
   Reflujo en dos pasos, panel de reglas, exportar/reproducir). Es el próximo paso natural: la
   UI ya está preparada para revisión a mano y ahí se mide H4/H5 de A-11-N4/N5.
2. **Campaña completa de simulación** (3000 partidas, ~20 min) con las nuevas variantes
   `stunned-duro` y `retroceso-defensor` para cuantificar H4/H5 sobre el dato, no solo a mano.
