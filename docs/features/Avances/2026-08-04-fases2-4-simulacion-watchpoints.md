# Etapa 11 · Fases 2-4 — Simulación con bots y reporte de watch points (balance-analista)

**Fecha:** 04/08/2026
**Rol:** balance-analista (simula y recomienda; **no aplica valores** — decide el dueño).
**Alcance:** Fases 2 (herramientas de simulación), 3 (campaña de 3000 partidas) y 4
(reporte de los 6 watch points + hallazgos). Fase 1 (instrumentación de métricas)
ya estaba cerrada. Fase 5 (checklist de playtest manual) queda como siguiente paso.

---

## 1. Método

Tres bots en `sim/bots.js`, cada uno decide solo intenciones legales a partir del
estado (nunca mutan el motor; su RNG propio se siembra aparte de `estado.rng`):

| Bot | Política |
|---|---|
| `botAleatorioLegal` | Elige tipo de acción al azar (carta / atacar / mover / concentrar / terminar). Garantiza combate: no huye del enemigo. |
| `botCodicioso` | Ataca si tiene objetivo, declara Muro defensivo, se acerca, concentra barato, termina. Aporta cartas a las técnicas. |
| `botAhorrador` | Nunca aporta cartas (guarda mano), usa Muro gratis con tokens, solo remata con técnica cuando le conviene. |

Campaña de la Fase 3 (`sim/correr.js`): **500 partidas × 6 configuraciones = 3000
partidas**, todas con `TOPE_TURNOS=300` y `TOPE_ERRORES=40`.

| Config | Variante | Qué mide |
|---|---|---|
| aleatorio/aleatorio | base | Línea base sin estrategia. |
| codicioso/codicioso | base | Emparejamiento principal; estrategia simétrica. |
| codicioso/ahorrador | base | Hoarding vs gasto de cartas. |
| codicioso/codicioso | contador-ronda | D-05: contador 1/3/5/9 por ronda. |
| codicioso/codicioso | stunned-keep | D-23: Stunned −1 dado guardado. |
| codicioso/codicioso | defensor-stunned | D-12: el defensor SÍ puede quedar Stunned. |

`npm test` (17 files / 220 tests) en verde. Determinismo verificado: misma semilla
→ mismo log (ignorando `timestamp`). 20 de 3000 partidas no terminaron (tope de
turnos): 10 en aleatorio/aleatorio, 9 en contador-ronda, 1 en codicioso/codicioso.

---

## 2. Watch points (reporte completo: `sim/reporte.js`)

Media por partida, con percentiles p10/p50/p90.

### WP-1 — Keep 2 domina → **NO domina**

Tasa de victoria del atacante, según arquetipo del atacante:

| Config | Keep2 (Campeón/Rey) | Resto | Global |
|---|---|---|---|
| aleatorio/aleatorio | 0.48 | 0.44 | 0.46 |
| codicioso/codicioso | 0.45 | 0.41 | 0.43 |
| codicioso/ahorrador | 0.26 | 0.38 | 0.34 |
| contador-ronda | 0.46 | 0.44 | 0.45 |
| stunned-keep | 0.46 | 0.40 | 0.42 |
| defensor-stunned | 0.45 | 0.41 | 0.43 |

El Keep 2 no vuelve trivial el combate: la ventaja del atacante Campeón/Rey es de
~3-4 pp, salvo en codicioso/ahorrador donde es inferior al resto (0.26 vs 0.38).
El atacante gana globalmente < 50%: **defender es más rentable que atacar**.

### WP-2 — Curva 1/3/5/9 inerte → **CONFIRMADO, en grado extremo**

Acciones pagadas por partida:

| Config | 2ª acción (3 PO) | 3ª acción (5 PO) | 4ª acción (9 PO) |
|---|---|---|---|
| aleatorio/aleatorio | 3.41 | **0** | **0** |
| codicioso/codicioso | **0** | **0** | **0** |
| codicioso/ahorrador | 4.86 | **0** | **0** |
| contador-ronda | 32.67 | **0** | **0** |
| stunned-keep / defensor-stunned | **0** | **0** | **0** |

Ni siquiera con `reinicioContador:'ronda'` se paga una 3ª acción (5 PO) o una 4ª
(9 PO). La curva 1/3/5/9 está funcionalmente muerta: **el juego se juega entero en
1-2 acciones por turno**.

### WP-3 — Foco escalonado vs mazo chico → **irrelevante en partidas reales**

| Config | Tokens Foco/partida | Técnicas/partida | Turnos 1er token → 1ª técnica |
|---|---|---|---|
| aleatorio/aleatorio | 13.02 | 0 | sin datos |
| codicioso/codicioso | 0.44 | 0.11 | 5.38 (n=45) |
| codicioso/ahorrador | 12.62 | 3.59 | 24 (n=490) |
| contador-ronda | 23.38 | 12.77 | 3.73 |

El Foco solo tiene vida cuando la partida dura (ahorrador, 3.11 rondas). En
codicioso/codicioso las partidas terminan tan rápido (ronda 1.5) que casi no hay
turnos para concentrar: **0.44 tokens y 0.11 técnicas por partida**.

### WP-4 — Asimetría de tempo (hoarding) → **correlaciona con victoria**

En contador-ronda (la única config con partidas largas): 455 de 491 partidas
terminadas tuvieron turnos en solitario, y en 85% de ellas el ganador fue quien
tuvo el solitario. En las configs cortas no hay tiempo material para hoarding
(0.03 turnos solitarios/partida en codicioso/codicioso).

### WP-5 — Muerte del Rey anticlimática → **CONFIRMADO, crítico**

Rondas de partida y ronda de muerte de cada Rey:

| Config | Rondas/partida (p50) | Muerte Rey A (ronda) | Muerte Rey B (ronda) | Victoria por Rey |
|---|---|---|---|---|
| aleatorio/aleatorio | 5.76 (6) | 5.62 (B gana) | 5.79 | 48% |
| codicioso/codicioso | **1.49 (1)** | 1.44 | 1.97 | **87%** |
| codicioso/ahorrador | 3.11 (3) | 3.10 | 3.11 | 85% |
| contador-ronda | 5.56 (5) | 5.35 | 6.19 | 74% |

En el emparejamiento principal **el Rey A muere en la ronda 1 (p50=1, p90=2)** y
el 87% de las partidas terminan por jaque mate. La partida "completa" se reduce a
un asalto al Rey.

### WP-6 — Efecto de Stunned → **castigo suave**

| Config | Atacante Stunned (tasa vict.) | Defensor Stunned (tasa vict.) | Referencia global |
|---|---|---|---|
| aleatorio/aleatorio | 0.35 | 0.41 | 0.46 |
| codicioso/codicioso | 0.31 | 0.42 | 0.43 |
| codicioso/ahorrador | 0.27 | 0.41 | 0.34 |
| contador-ronda | 0.36 | 0.42 | 0.45 |
| stunned-keep | 0.37 | 0.50 | 0.42 |
| defensor-stunned | 0.33 | 0.42 | 0.43 |

El atacante Stunned gana ~10 pp menos que la referencia. La variante
`stunned-keep` (D-23) apenas lo suaviza. **Stunned se siente como un impuesto
bajo, no como una decisión táctica.**

### Combate (contexto)

- 38-48 intercambios/partida; frecuencia de explosiones 25-29% (alta).
- Heridas por ataque, más altas en **Campeón (0.53-0.63)** y Alfil (0.45-0.57);
  más bajas en Peón (0.22-0.40).
- PO perdidos sin gastar: 1-1.5/partida en codicioso (gasta todo), pero 111-166
  en contador-ronda / aleatorio (economía rota cuando no hay bot codicioso).

---

## 3. Hallazgos principales (ordenados por impacto en "una partida completa")

### H1 — La plantilla de Agua gana 81-95% sin importar nada más (crítico)

Victoria de A en los tres emparejamientos: aleatorio/aleatorio **19%**,
codicioso/codicioso **8%**, codicioso/ahorrador **96%** (aquí gana A porque B
ahorra cartas). Descompuesto por orden de juego (n=150, codicioso/codicioso):
gana A cuando A empieza 6% vs cuando B empieza 5%. **No es el orden de juego: es
la plantilla.** La banda B (Agua) tiene Alfil (rango 3) y Campeón (2g2, Keep 2)
contra Torre y Caballo de Fuego — dos unidades superiores en rango y dados.

### H2 — El Rey cae en la ronda 1 y mata la partida (crítico)

Ver WP-5. La partida "completa" del MVP no existe en la práctica contra dos
jugadores racionales: termina por jaque mate al turno siguiente del primer
contacto. Es la causa raíz de que Foco, Técnicas, curva y tempo no se midan:
**no hay tiempo de partida para que existan.**

### H3 — La curva 1/3/5/9 no se usa nunca (alto)

Ver WP-2. El escalón de 3 PO ya es caro de alcanzar; 5 y 9 PO son teóricos. El
juego se decide por el pool de dados, no por la economía de acciones.

### H4 — Defender es mejor que atacar (medio)

WP-1: el atacante gana < 50% en todas las configs salvo contexto de hoarding.
Esto, combinado con H2, premia esperar a que el rival se acerque.

### H5 — Stunned es un impuesto bajo, no una decisión (medio)

WP-6. −10 pp al atacante, sin efecto apreciable en el defensor en las variantes.

---

## 4. Qué NO prueba esta simulación

- Si el juego es divertido o las decisiones interesantes (eso lo responden humanos).
- Si las unidades se sienten distintas más allá de la tasa de victoria.
- El valor de las Técnicas de defensa (Muro) y de doble objetivo (Doble Tiro):
  los bots solo declaran técnicas de ataque pagables con tokens o carta.
- La asimetría de plantilla por **orden de juego** ya está descartada (H1), pero
  el desbalance entre bandas solo se verificó contra bots, no contra humanos.

---

## 5. Recomendaciones (a decidir por el dueño; balance-analista no aplica valores)

Priorizadas para que exista una **partida completa jugable**:

1. **Proteger al Rey (bloquea H2, desbloquea todo lo demás).** El Rey muere en
   ronda 1 y por eso Foco, Técnicas, curva y tempo son invisibles. Opciones a
   evaluar: subir Vida/Defensa del Rey, impedir que una sola unidad lo ataque el
   primer contacto, o una regla de "no se ataca al Rey en ronda 1".
2. **Reequilibrar la plantilla de Fuego (H1).** Torre y Caballo rinden por
   debajo de Alfil y Campeón. Opciones: subir rango/dados de Torre o Caballo,
   bajar Alfil, o reasignar perfiles entre bandas.
3. **Darle uso real a la curva 1/3/5/9 (H3).** Si 3 PO ya es caro, revisar el
   coste de la 2ª acción o el valor de las acciones caras antes de diseñar
   contenido en torno a ellas.
4. **Decidir si Stunned debe doler más (H5).** Si es decisión táctica y no
   impuesto, subir el coste de quedar Stunned (p. ej. D-23 ya probado, o pierde
   toda la reacción defensiva).

### Decisiones abiertas nuevas (ninguna se aplicó)

- **A-11-N1:** ¿Cómo se protege al Rey en ronda 1? (sin GDD ni escenario actual).
- **A-11-N2:** ¿Qué perfil de Fuego se sube / Agua se baja para cerrar el 8-19%?
- **A-11-N3:** ¿La curva 1/3/5/9 queda como está (muerta) o se redefine el coste
  de la 2ª/3ª/4ª acción?

---

## 6. Veredicto de Fases 2-4

Herramientas de simulación operativas, deterministas y con 3000 partidas en
`sim/resultados.json`. **El hallazgo que domina la Etapa 11 no es un valor de
regla sino dos decisiones de diseño que impiden la partida completa:** el Rey cae
en la ronda 1 (H2) y la banda Agua es estructuralmente superior a Fuego (H1).
Ningún ajuste fino de Stunned, Foco o curva es medible mientras la partida
termine en 1.5 rondas.

La Fase 4 queda cerrada con este documento. **Pendiente para cerrar la Etapa 11:**
Fase 5 (checklist de playtest manual) y las decisiones A-11-N1 a N3.

---

## Archivos

- `sim/bots.js` — las 3 políticas de bot.
- `sim/correr.js` — runner con checkpoints/reanudación, `CAMPAÑA` (6 configs).
- `sim/reporte.js` — reporte media + p10/p50/p90 por `config::variante`.
- `sim/metricas.js` — derivación de los 6 watch points desde `estado.log`.
- `sim/resultados.json` — 3000 partidas (500 × 6).
- `sim/analisis-orden.js` — descomposición A/B por jugador inicial (H1).
- `package.json` — scripts `sim` y `sim:reporte`.
