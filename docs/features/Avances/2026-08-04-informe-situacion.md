# Etapa 11 — Informe de situación (04/08/2026)

**Fecha:** 04/08/2026
**Propósito:** estado del proyecto al cierre del día. El detalle de historias,
decisiones y auditorías está en `2026-08-04-reporte-trabajo.md`; el reporte de
balance en `2026-08-04-fases2-4-simulacion-watchpoints.md`.

---

## Estado global

El MVP del Motor de Escaramuza es **jugable de principio a fin en el navegador**:

```
ROBO CARTA → DECIDO FUNCIÓN → GENERO PO → ACTIVO UNIDAD → EJECUTO ACCIÓN
→ ACUMULO FOCO → PREPARO TÉCNICA → COMBATO → CAMBIA EL ESTADO DEL TABLERO
→ RONDA → VICTORIA
```

- **Tests:** 17 files / 220 tests en verde, sin regresiones.
- **Build:** `npm run build` en verde (54 módulos).
- **Motor determinista:** misma semilla → misma partida (verificado también en
  la simulación).
- **Reglas 🟡:** las decisiones D-01 a D-24 viven en `src/data/rules.js` y se
  leen desde `estado.reglas`; ninguna quedó hardcodeada.

---

## Estado por módulo

| Módulo | Estado |
|---|---|
| Motor de reglas (`src/engine/`) | Completo: tablero/hex, cartas-PO, activación 1/3/5/9, Foco, combate Roll & Keep, Técnicas (5), Stunned, ronda/victoria, registro, métricas. |
| Datos (`src/data/`) | Arquetipos (6), facciones asimétricas (Fuego/Agua), 5 Técnicas, escenario base, reglas conmutables. |
| UI (`src/ui/`) | Bucle de partida completo: tablero SVG clickeable, mano, PO, ficha de unidad, menú de acciones, técnicas, fin de ronda, victoria, semilla editable, exportar/reproducir, panel de reglas (D-05/D-08/D-12/D-23). |
| Instrumentación | `estado.secuencia`, export JSON `{ semilla, reglas, secuencia }`, `reproducirPartida`, `metricasDePartida`. |
| Simulación (`sim/`) | 3 bots, runner con checkpoints, reporte por percentiles. 3000 partidas jugadas (500 × 6 configs). |

---

## Hallazgos de balance (en síntesis — ver fases 2-4)

1. **H1 — La plantilla de Agua gana 81-95%** sin importar el orden de juego
   (verificado): es la plantilla (Alfil rango 3 + Campeón vs Torre + Caballo).
2. **H2 — El Rey muere en la ronda 1** en el emparejamiento principal
   (codicioso/codicioso: p50 = ronda 1, 87% de victorias por jaque mate). La
   partida "completa" no existe contra dos jugadores racionales.
3. **H3 — La curva 1/3/5/9 está muerta**: nadie paga una 3ª/4ª acción en
   ninguna config (5 PO y 9 PO = 0 en todas).
4. **H4 — Defender es más rentable que atacar** (atacante gana < 50% global).
5. **H5 — Stunned es un impuesto bajo** (~ −10 pp al atacante, no una decisión).

Estos hallazgos condicionan todo lo que sigue: **mientras el Rey caiga en ronda
1, Foco, Técnicas, curva y tempo son invisibles.**

---

## Decisiones abiertas nuevas (ninguna se aplicó — decide el dueño)

| ID | Pregunta |
|---|---|
| A-11-N1 | ¿Cómo se protege al Rey en ronda 1? |
| A-11-N2 | ¿Qué perfil de Fuego se sube / de Agua se baja para cerrar el 8-19%? |
| A-11-N3 | ¿La curva 1/3/5/9 queda muerta o se redefine el coste de 2ª/3ª/4ª acción? |

Pendientes previas ya registradas: B.1 (test dedicado para E-1 / D-17) y B.2
(comentario obsoleto en `10-instrumentacion.feature:69`).

---

## Pendientes

1. **Playtest manual completo** en el navegador (`npm run dev`): flujo de
   Reflujo en dos pasos, panel de reglas, exportar/reproducir.
2. **Fase 5 de la Etapa 11:** checklist de playtest manual (la Fase 4 ya está
   cerrada con el reporte de watch points).
3. **Ajustes de balance (A-11-N1..N3)** tras decisión del dueño — prioridad:
   proteger al Rey, reequilibrar Fuego, decidir la curva.
4. **Sesión de UI** dedicada post-simulación: "Pantalla de juego más rica" +
   "Estética / look and feel" (dirección acordada). Restricciones de la skill
   `ui-tablero-hex`: sin animaciones, sin drag&drop, sin responsive; la UI solo
   despacha intenciones.

---

## Cómo arrancar

```bash
npm run dev    # prototipo en el navegador
npm test       # 17 files / 220 tests
npm run sim    # correr campaña de simulación (reanuda checkpoints)
npm run sim:reporte   # regenerar reporte de watch points
```

---

## Archivos de referencia

| Archivo | Qué es |
|---|---|
| `docs/features/Avances/2026-08-04-reporte-trabajo.md` | Reporte del día: historias, decisiones D-14..D-24, auditorías, bugs. |
| `docs/features/Avances/2026-08-04-fases2-4-simulacion-watchpoints.md` | Reporte de balance (3000 partidas, 6 watch points, recomendaciones). |
| `docs/BACKLOG.md` | Backlog, arquitectura, orden de implementación, decisiones. |
