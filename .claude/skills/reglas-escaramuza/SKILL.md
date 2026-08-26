---
name: reglas-escaramuza
description: Reglas congeladas del MVP del Motor de Escaramuza (PO, Foco, acciones, combate D10 Roll and Keep, estados, ronda y victoria) más las decisiones abiertas D-01 a D-12 con su valor de arranque y las aprobadas D-13…D-28. Usar SIEMPRE antes de implementar, testear o revisar cualquier mecánica del juego, y cada vez que haya que decidir cómo se comporta una regla. Si una regla no está acá, no está decidida: preguntar, no inventar.
---

# Reglas congeladas — MVP Motor de Escaramuza

Fuente: `docs/Memoria_Maestra_Diseño_Juego.md` (GDD) y `docs/Alcance_Funcional_MVP.md`.
Ante conflicto entre esta skill y el código, manda esta skill.
Ante conflicto entre esta skill y el GDD, manda el GDD y hay que corregir esta skill.

## Regla de oro

**Si una situación no está resuelta acá ni en el GDD, no se inventa.** Se marca como decisión
pendiente, se propone un valor de arranque y se pregunta. Inventar reglas en silencio es el
principal riesgo del proyecto: rompe el playtest porque ya no se sabe qué se está midiendo.

## Elementos

🔥 Fuego · 💧 Agua · 🌪️ Aire · 🌍 Tierra · ◼️ Vacío.
Las acciones básicas aceptan PO de **cualquier** elemento. Las Técnicas exigen elemento específico.

## Cartas y PO

- Mazo de 15 cartas por facción. Cada carta: elemento + valor de Orden 1–3.
- En el MVP **toda carta se juega como Orden**. No existen Equipo ni Recurso.
- Jugar carta genera PO igual a su valor, del elemento de la carta; la carta va al descarte.
- Jugar carta es **obligatorio**: no se puede pasar. Una carta por turno.
- Los PO **no** se acumulan entre turnos: lo no gastado ni convertido a Foco se pierde.
- El único depósito persistente es el Foco de cada unidad.

## Acciones

Cuatro: **Mover, Atacar, Interactuar, Foco (Concentrarse)**.

- Coste progresivo **por unidad**: 1ª = 1 PO, 2ª = 2, 3ª = 3, 4ª = 5. Contador individual.
  Curva **1/2/3/5** (aprobada 05/08/2026, A-11-N3; antes 1/3/5/9, muerta en la práctica porque
  3ª y 4ª acción nunca se pagaban con 1 carta por turno). Vive en `estado.reglas.costesAccion`.
- **Mover**: hasta su valor de Movimiento; no atraviesa hexágonos ocupados ni bloqueados.
- **Atacar**: cierra la activación de esa unidad por el resto del turno.
- **Concentrarse**: convierte PO en tokens elementales (ver Foco).
- Se pueden intercalar activaciones entre unidades mientras haya PO.

## Foco

- El Foco es un **valor fijo del arquetipo** = máximo de tokens almacenables.
- Coste escalonado por token: 1º = 1 PO, 2º = 3 PO, 3º = 5 PO. Llenar Foco 2 cuesta 4 PO.
- Una unidad puede guardar tokens de **elementos distintos** a la vez.
- Los tokens **no se transfieren** entre unidades.
- Una unidad puede recibir energía de varias fuentes en el mismo turno, sin superar su Foco.

## Tablero, distancia y visión

- Tablero hexagonal. Adyacente = distancia 1.
- La distancia se cuenta por hexágonos, no exige línea recta.
- **Rango se mide igual que el Movimiento**: Rango 1 = adyacente, Rango n = n hexágonos.
- LoS: línea recta de **centro a centro**. Obstruida si atraviesa un hexágono bloqueado u
  ocupado (amigo o enemigo). Si solo toca el **borde**, NO obstruye.

## Combate — D10 Roll and Keep

Notación `XgY` = tirar X dados, guardar Y. Base: Ataque 1g1, Defensa 1g1, modificado por arquetipo.

1. El atacante tira su pool de Ataque y guarda su Keep.
2. El defensor tira su pool de Defensa y guarda su Keep.
3. Cada uno **suma** sus dados guardados. Sin dificultad ni conteo de éxitos.

| Resultado | Efecto |
|---|---|
| Atacante saca más | El defensor recibe **1 herida** |
| Defensor saca más | El atacante **retrocede 1 hex** y queda **Stunned** |
| Empate | Gana la defensa: idéntico a "defensor saca más" |

- Daño: perder = 1 herida. **No hay segunda tirada de daño.**
- **Dados explosivos:** un 10 tira un D10 extra que se suma; encadena.
- Un dado explotado se evalúa por su valor **acumulado** al decidir cuáles se guardan.
- **D-16 (Reflujo):** la resolución de un ataque con Reflujo queda en pausa en
  `estado.combatePendiente` hasta que se despacha `REFLEJAR_DADOS`. Mientras haya pendiente, no se
  acepta ninguna otra intención salvo `REFLEJAR_DADOS` o `CAMBIAR_REGLAS`.
- **A-11-N5 (retroceso del defensor):** si el atacante gana por diferencia ≥ 2, el defensor
  retrocede 1 hex además de la herida. Conmutable `retrocesoDefensorDiferencia2` (default `false`).
- Fuera del MVP: críticos, cobertura, ataques múltiples generales, dificultad, iniciativa compleja.

## Unidades (valores de arranque 🟡)

| Arquetipo | Mov | Ataque | Defensa | Vida | Rango | Foco |
|---|---|---|---|---|---|---|
| Peón | 3 | 1g1 | 1g1 | 2 | 1 | 1 |
| Alfil | 4 | 2g1 | 1g1 | 2 | 3 | 2 |
| Torre | 2 | 2g1 | 2g1 | 4 | 1 | 1 |
| Caballo | 5 | 2g1 | 1g1 | 3 | 1 | 1 |
| Campeón | 4 | 2g2 | 2g1 | 4 | 2 | 3 |
| Rey | 3 | 1g1 | 2g2 | 4 | 1 | 2 |

**Regla de diseño crítica:** subir el Keep es mucho más potente que subir el pool. El Keep 2 se
reserva al Campeón (ataque) y al Rey (defensa). No repartir Keep 2 al implementar facciones nuevas.

## Técnicas (catálogo mínimo)

| Técnica | Coste | Arquetipos | Efecto |
|---|---|---|---|
| Explosión | 🔥🔥 | Peón, Campeón | Este ataque: +1 dado al pool y explota con 9–10 |
| Doble Tiro | 🌪️💧 | Alfil | Un ataque a distancia impacta dos objetivos adyacentes entre sí |
| Muro | 🌍🌍 | Torre | Hasta su próxima activación, Keep +1 en Defensa |
| Reflujo | 💧💧 | Alfil, Campeón | Tras tirar el Ataque, repetir cualquier cantidad de dados, una vez |
| Disipar | ◼️◼️ | Campeón | Anula la Técnica defensiva del objetivo o le resta 1 dado guardado |

- **Pago mixto:** si la Técnica pide más tokens que el Foco de la unidad, el excedente se cubre
  con una carta del elemento correcto jugada en el momento. Esa carta no genera PO ni cuenta
  como la carta obligatoria del turno.

## Estados

Solo existe **Stunned** en el MVP: la próxima tirada de la unidad (ataque o defensa) usa un dado
menos, mínimo 1, y después el estado se remueve. Ningún otro estado se implementa.

## Ronda y victoria

- Jugador inicial por tirada de moneda.
- Los jugadores alternan turnos. Quien se queda sin cartas cede el turno; el otro sigue en solitario.
- La ronda termina cuando **ambas** manos están vacías.
- Derrota si todas las unidades del jugador son eliminadas.
- Derrota **inmediata** si muere el Rey.

## Decisiones abiertas (viven en `src/data/rules.js`, nunca hardcodeadas)

| ID | Pregunta | Arranque |
|---|---|---|
| D-01 | ¿Los tokens de Foco persisten entre rondas? | Sí |
| D-02 | ¿Concentrarse incrementa el contador 1/2/3/5? | No |
| D-03 | ¿Cuándo se declara una Técnica? | Junto con Atacar, antes de tirar |
| D-04 | ¿El coste del token mira tokens guardados o comprados este turno? | Guardados en reserva |
| D-05 | ¿El contador de acciones se reinicia por turno o por ronda? | Por turno |
| D-06 | ¿Y si el atacante no puede retroceder? | Se queda, igual queda Stunned |
| D-07 | ¿Cuál es el hex "de atrás"? | El opuesto al defensor; si está tomado, el vecino libre más lejano |
| D-08 | Mano inicial y robo | Mano 5, robo **0** por turno (aprobado 05/08/2026: cada jugador gasta sus 5 cartas y la ronda termina con ambas manos vacías) |
| D-09 | ¿Qué pasa al terminar la ronda? | Rebarajar descarte y robar mano nueva |
| D-10 | ¿Stunned puede dejar el pool en 0? | No, mínimo 1 dado |
| D-11 | Despliegue inicial | Posiciones fijas del escenario base |
| D-12 | ¿El defensor puede quedar Stunned? | No, solo recibe la herida |

### Decisiones aprobadas D-13…D-24 (04/08/2026) y reglas A-11 (05/08/2026)

Todas viven en `src/data/rules.js` y se leen desde `estado.reglas`. Ninguna se hardcodea.

| ID | Decisión aprobada |
|---|---|
| D-13 | Umbrales de explosión: por defecto 10, con Explosión 9; tope de cadena por defecto 20 |
| D-14 | Disipar anula la técnica defensiva activa si la hay; si no, reduce 1 dado guardado (mín 1). Nunca ambos efectos |
| D-16 | Reflujo se resuelve en dos pasos: `estado.combatePendiente` + intención `REFLEJAR_DADOS`. El RNG solo se consume dentro de intenciones |
| D-17 | Un dado explotado se repite hasta **nivel de Foco** veces (sustituye el tope fijo 20 de D-13). Conmutable `explosionTopePorFoco` |
| D-18 | Canal de activación gratuita **sin disparador** en el MVP; explosión como disparador a futuro |
| D-19 | El ataque gratuito no cuenta en el contador 1/2/3/5 ni consume PO; cierra igual la activación. Flag `{ gratuita: true }` |
| D-20 | `estado.secuencia` registra `{ tipo, jugador, ...payload }` por intención aplicada (base del replay) |
| D-21 | Export JSON `{ semilla, reglas, secuencia }` + `src/engine/metrics.js` que lee el log |
| D-22 | El panel de ajustes expone solo flags cableados (D-05, D-12 y `roboPorTurno`) |
| D-23 | Flag `stunnedReduceKept` (default `false`): Stunned resta 1 al keep (mín 1) |
| D-24 | Cambio de reglas en caliente vía intención `CAMBIAR_REGLAS` con validación y evento de log |

| Regla A-11 | Decisión aprobada (05/08/2026) |
|---|---|
| N1 `reyProtegidoRonda1` | El Rey no puede ser objetivo de ataque en la Ronda 1 (garantiza mínimo una ronda de juego) |
| N3 `costesAccion` | Curva 1/2/3/5 conmutable |
| N4 `stunnedDuro` | Stunned reduce 1 dado del pool **y** 1 del keep (cada uno mínimo 1). Prevalece sobre D-23 cuando ambos están activos. Default `false` |
| N5 `retrocesoDefensorDiferencia2` | Ganar por diferencia ≥ 2 empuja 1 hex al defensor además de la herida. Default `false` |
| N6 `tecnicasUnaPorRonda` | Una sola Técnica por ronda por unidad. Default `true` |

### Decisiones aprobadas D-25…D-28 (07–11/08/2026)

| ID | Decisión aprobada |
|---|---|
| D-25 | Las cartas pueden jugarse como Habilidad elemental (uso excluyente de Orden, sin PO). **SUPERADA por D-27** en el gate de rol y la escala por valor |
| D-26 | Mecánica **Lugar** (playtest 07/08/2026): santuarios capturables con Interactuar desde sobre/adyacente (dist. ≤1). Coste FIJO 2 PO (rompe la curva 1/2/3/5 a propósito), +1 VP **solo visual**. La casilla capturada pasa a `bloqueados` (impide movimiento y LoS). Flags `lugarHabilitado`, `costeCapturaLugar`, `lugarVpGanancia` |
| D-27 | La habilidad es **de la carta**, no del rol. Cada carta declara su efecto en `HABILIDADES_POR_CARTA` con magnitud FIJA; el origen es cualquier unidad aliada en rango/LoS del objetivo (sin gate de rol). `habilitarHabilidadesCarta` ON por defecto |
| D-28 | El **agua bloquea el MOVIMIENTO pero NO la línea de visión** (los arqueros disparan a través del río). Los hexes de agua viven en `tablero.bloqueaMovimientoSinLos` (apartados de `bloqueados`), se fusionan en `bloqueadosParaMovimiento` pero no obstruyen `hayLoS` salvo flag `aguaBloqueaLoS` (default `false`). Solo las 5 plantillas de mapa de `scenarios.js` traen agua; el escenario base no |

## Watch points de balance (no son bugs, son cosas a medir)

Keep 2 dominante · curva 1/2/3/5: vigilar que la 4ª acción (5 PO) exista con 1 carta por turno ·
Foco escalonado exige dos turnos para una Técnica de 2 tokens · asimetría de tempo que premia
retener cartas · muerte anticlimática del Rey por combate swingy · Stunned demasiado suave o
demasiado duro.
