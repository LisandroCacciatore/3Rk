# Motor de Escaramuza — Paquete de contexto para agentes externos

**Última actualización:** 07/08/2026
**Propósito:** entregar a un agente externo (Claude Code, ChatGPT u otro) TODO el contexto
necesario para hacer recomendaciones de diseño sobre **worldbuilding, nuevas cartas, flujo de
cartas (economía) y disposición de tablero**, y devolverlas como **User Stories en Gherkin**
listas para el backlog. **Este archivo es autocontenido**: no requiere acceso al repositorio.
Todo lo necesario está escrito abajo.

> **Regla de oro del proyecto (aplica a todo lo que propongas):** si una regla no está acá ni
> en el GDD original, **no se inventa**. Se marca como decisión abierta con un valor de arranque
> propuesto y se pregunta. Un modelo que rellena un hueco con una decisión "razonable" arruina el
> playtest: a partir de ahí ya no se sabe qué se está midiendo.

---

# PARTE 1 — Para el dueño (resumen ejecutivo)

## 1. Resumen ejecutivo

- **Qué es:** prototipo web jugable (Vite + React 18 + JS plano, sin TypeScript) de un juego de
  mesa táctico de escaramuzas con deckbuilding. No es un producto: es una herramienta de playtest
  para validar el núcleo táctico.
- **Estado:** el MVP de reglas está implementado al 100%. 269 tests en verde, build OK. Se simuló
  una campaña de 3000 partidas con bots y se ajustó el balance (decisiones A-11-N1…N6). El playtest
  manual en navegador está en curso (F.4). Las **cartas admiten un segundo uso** como Habilidad
  elemental (D-24/D-25, US-160/US-016/US-017, flag `habilitarHabilidadesCarta` por defecto `false`):
  rol canalizador + objetivo en rango/LoS, valor escala el efecto (Fuego daña, Agua cura, Aire +pool,
  Tierra tokens Foco, Vacío altera Stunned).
- **Qué se le pide al agente externo:** recomendaciones de diseño en **4 dominios** (sección 9):
  1. **Worldbuilding** — identidad narrativa de facciones, arquetipos y mundo.
  2. **Nuevas cartas** — cartas de deckbuilding, su función y su interacción con PO/Foco/Técnicas.
  3. **Río de cartas / economía** — el flujo robo → mano → PO → ronda y su estructura de mazo.
  4. **Disposición de tablero** — escenarios, terreno, hexágonos bloqueados y despliegue.
- **Qué debe devolver el agente:** por cada recomendación, **una Característica Gherkin** según la
  plantilla de la sección 11, con justificación breve (sección 13). No debe proponer cambios a
  reglas congeladas; puede marcar extensiones como 🔴 diferidas a la fase 4X.
- **Cómo vuelve al repo:** el dueño recibe las US del agente, las revisa contra este contexto y las
  incorpora como archivos `.feature` en `docs/features/` con su épica correspondiente.

## 2. Cómo usar este archivo

1. Leé las PARTES 2 y 3 completas antes de proponer nada (reglas y decisiones primero, porque son
   las restricciones duras).
2. Elegí un dominio de la sección 9. Leé su brief completo (qué hay hoy, qué se pide, qué NO se
   puede violar).
3. Produci las recomendaciones y escribí **una Característica Gherkin por propuesta** siguiendo la
   plantilla de la sección 11. Las US modelo de la sección 12 son ejemplos del nivel de calidad
   esperado.
4. Respetá las "reglas de oro" de la sección 10.
5. Devolvé el resultado con el formato de la sección 13.

---

# PARTE 2 — Contexto de diseño (para los agentes)

## 3. Visión y filosofía

Juego de mesa táctico de **escaramuzas con deckbuilding**, para partidas de **4–6 miniaturas por
jugador**. El sistema combina: combate táctico en hexágonos, activación de unidades mediante
cartas, gestión de energía elemental, deckbuilding y unidades asimétricas.

**Filosofía central:**

- Cada carta es una **decisión estratégica**, no un efecto aislado.
- Una carta puede convertirse en poder inmediato (**Orden** = PO), mejora permanente (**Equipo**) o
  progreso económico (**Recurso**). En el MVP solo existe Orden; Equipo y Recurso están diferidos.
- **La mejor jugada no debe ser obvia por el valor numérico de la carta**: una carta de 1 PO puede
  valer más que una de 3 según su elemento, momento y función.

**Principios de diseño:**

1. **Cartas multifunción.** El jugador elige entre resolver el presente, mejorar una unidad,
   generar progreso económico o almacenar energía elemental. Tensión buscada: **presente vs.
   futuro**.
2. **Un único lenguaje mecánico.** Cartas iniciales y cartas de deckbuilding usan el mismo
   vocabulario (+1 dado, +1 dado guardado, repetir dado, explotar dados, almacenar energía,
   convertir elementos, habilitar Técnicas). No hay minijuegos separados.
3. **Fluidez para lo básico, especificidad para lo avanzado.** Los PO pagan acciones básicas sin
   importar su elemento; las Técnicas exigen elementos concretos.

**Flujo del sistema (MVP activo):**
`Mazo → PO → Activación → (Mover / Atacar / Foco) → Técnica → Combate (D10 Roll & Keep)`.

**El MVP NO valida** la fase 4X (recursos, construcciones, influencia, economía de valor,
deckbuilding avanzado, combate avanzado). Todo eso es 🔴 diferido.

## 4. Estado del proyecto

| Área | Estado |
|---|---|
| Motor de reglas (11 épicas del backlog) | ✅ Completo y testeado — determinista (misma semilla → misma partida) |
| Decisiones 🟡 D-01…D-24 y A-11-N1…N6 | ✅ Todas en `src/data/rules.js`, leídas desde `estado.reglas`, conmutables en el panel de ajustes |
| UI (épica UI-02, 11 historias) | ✅ Implementada; tablero hexagonal en SVG, sprites 16-bit, HUD. Mapa en estilo Fire Emblem GBA (terreno determinista por semilla: prado/bosque/agua/montaña/camino/ruinas + corona de borde) vía `src/ui/terreno.js` y `src/ui/terrenoVisual.jsx` — capa presentacional, no toca el motor |
| Gaps de cierre (épicas UI-03 y PLAYTEST-02) | ✅ US-104 (screen shake global), US-105 (calibración de sprites), US-106 (métricas profundas por arquetipo) implementadas y verificadas |
| Simulación con bots | ✅ Campaña de 3000 partidas + panel en navegador; `sim/metricas.js` ahora reporta desempeño por arquetipo (daño hecho/recibido, derrotas, rondas, técnicas, foco) y por facción |
| Playtest manual F.4 | 🟨 En curso: Reflujo (D-16) verificado a mano; falta panel de reglas, replay y visibilidad por turno |
| Suite de tests | ✅ 257/257 en verde, build OK |

**Arquitectura no negociable (para propuestas de contenido, solo informativo):** el motor de reglas
(`src/engine/`) es JS puro sin React ni DOM; la UI (`src/ui/`) no contiene reglas. Toda regla 🟡
vive en `src/data/rules.js`. Una propuesta que diga "regla hardcodeada en el motor" es un bug de
arquitectura.

## 5. Reglas congeladas (MVP)

> Estas reglas son **firmes para el playtest**. Las recomendaciones deben operar dentro de ellas o
> marcarlas explícitamente como extensión. Si una propuesta las contradice, debe justificarse por
> qué y marcarse como decisión abierta, nunca aplicarse en silencio.

### Elementos
Cinco elementos: 🔥 Fuego · 💧 Agua · 🌪️ Aire · 🌍 Tierra · ◼️ Vacío. Son el lenguaje que conecta
cartas, PO, Foco, Técnicas y modificaciones de combate.

Tendencias de identidad elemental (🟡 direcciones, no tabla cerrada):

| Elemento | Tendencia mecánica |
|---|---|
| 🔥 Fuego | explosiones, daño, agresión |
| 💧 Agua | rerolls, manipulación de resultados, adaptación |
| 🌍 Tierra | Keep, defensa, resistencia |
| 🌪️ Aire | Dice Pool, movilidad, precisión |
| ◼️ Vacío | alterar reglas, conversión, efectos excepcionales |

### Cartas y PO
- Mazo de **15 cartas por facción**. Cada carta: **elemento + valor de Orden 1–3**.
- En el MVP **toda carta se juega como Orden**. No existen Equipo ni Recurso.
- Jugar una carta genera PO igual a su valor, del elemento de la carta; la carta va al descarte.
- Jugar carta es **obligatorio**: no se puede pasar. **Una carta por turno.**
- Los PO **no se acumulan entre turnos**: lo no gastado ni convertido a Foco se pierde al terminar
  el turno. El único depósito persistente es el Foco de cada unidad.
- Las acciones básicas aceptan PO de **cualquier** elemento; las Técnicas exigen elemento
  específico.

### Acciones
Cuatro: **Mover, Atacar, Interactuar, Foco (Concentrarse)**.

- **Coste progresivo por unidad**: 1ª acción = 1 PO, 2ª = 2, 3ª = 3, 4ª = 5. Contador individual
  por unidad y por turno (curva **1/2/3/5**, aprobada 05/08/2026 — antes 1/3/5/9, muerta en la
  práctica).
- **Mover**: hasta su valor de Movimiento; no atraviesa hexágonos ocupados ni bloqueados.
- **Atacar**: cierra la activación de esa unidad por el resto del turno (no se puede
  mover→atacar→mover con la misma unidad).
- Se pueden intercalar activaciones entre unidades mientras haya PO disponibles.
- Tras atacar con una Técnica, se aplica la regla de **una Técnica por ronda por unidad**.

### Foco
- El Foco es un **valor fijo del arquetipo** = máximo de tokens elementales que puede almacenar.
- **Coste escalonado por token**: 1º = 1 PO, 2º = 3 PO, 3º = 5 PO. Llenar una unidad de Foco 2
  cuesta 4 PO en total.
- Una unidad puede guardar tokens de **elementos distintos** a la vez.
- Los tokens **no se transfieren** entre unidades.
- Una unidad puede recibir energía de varias fuentes en el mismo turno sin superar su Foco.

### Tablero, distancia y visión
- Tablero hexagonal. Adyacente = distancia 1.
- La distancia se cuenta por hexágonos y **no exige línea recta**.
- **Rango se mide igual que el Movimiento**: Rango 1 = adyacente; Rango n = a n hexágonos.
- **Línea de visión (LoS):** línea recta del **centro** del hexágono del atacante al **centro** del
  hexágono del objetivo. Obstruida si atraviesa un hexágono bloqueado u ocupado (amigo o enemigo).
  Si solo toca el **borde** de un hexágono bloqueado/ocupado, **no** se considera obstruida.

### Combate — D10 Roll & Keep
Notación `XgY` = tirar X dados, guardar Y. Base: Ataque 1g1, Defensa 1g1, modificado por arquetipo.

1. El atacante tira su pool de Ataque y guarda su Keep.
2. El defensor tira su pool de Defensa y guarda su Keep.
3. Cada uno **suma** sus dados guardados. Sin dificultad ni conteo de éxitos.

| Resultado | Efecto |
|---|---|
| Atacante saca más | El defensor recibe **1 herida** |
| Defensor saca más | El atacante **retrocede 1 hex** y queda **Stunned** |
| Empate | Gana la defensa: idéntico a "defensor saca más" |

- **Daño:** perder un combate = **1 herida**. No hay segunda tirada de daño.
- **Dados explosivos:** un **10** tira un D10 extra que se suma; puede encadenar si vuelve a
  explotar. Un dado explotado se evalúa por su valor **acumulado** al decidir cuáles se guardan.
- **D-16 (Reflujo):** la resolución de un ataque con Reflujo se pausa en `estado.combatePendiente`
  hasta que el jugador envía `REFLEJAR_DADOS` (repetir dados elegidos, una vez).
- **A-11-N5 (retroceso del defensor):** si el atacante gana por diferencia ≥ 2, el defensor
  retrocede 1 hex además de la herida. Conmutable (default `false`).
- Fuera del MVP: críticos, cobertura, ataques múltiples generales, dificultad, iniciativa compleja.

### Estados
Solo existe **Stunned**: la próxima tirada de la unidad (ataque o defensa) usa **un dado menos**
(mínimo 1) y luego el estado se remueve. Ningún otro estado se implementa en el MVP.

### Ronda y victoria
- **Jugador inicial** por tirada de moneda.
- Los jugadores **alternan turnos**. Quien se queda sin cartas cede el turno; el otro sigue tomando
  turnos **en solitario** hasta agotar su mano.
- La **ronda termina** cuando **ambas** manos están vacías.
- **Derrota** si todas las unidades del jugador son eliminadas, o **inmediata** si muere su Rey.

## 6. Decisiones abiertas (D-01…D-24) y reglas de balance (A-11)

Todas viven en `src/data/rules.js`, se leen desde `estado.reglas` y son conmutables desde el panel
de ajustes. **Ninguna se hardcodea.** Valores de arranque:

| ID | Pregunta | Arranque |
|---|---|---|
| D-01 | ¿Los tokens de Foco persisten entre rondas? | Sí |
| D-02 | ¿Concentrarse incrementa el contador de acciones? | No |
| D-03 | ¿Cuándo se declara una Técnica? | Junto con Atacar, antes de tirar |
| D-04 | ¿El coste del token mira tokens guardados o comprados este turno? | Guardados en reserva |
| D-05 | ¿El contador de acciones se reinicia por turno o por ronda? | Por turno |
| D-06 | ¿Y si el atacante no puede retroceder? | Se queda en su hex, igual queda Stunned |
| D-07 | ¿Cuál es el hex "de atrás"? | El opuesto al defensor; si está tomado, el vecino libre más lejano |
| D-08 | Tamaño de mano inicial y robo por turno | Mano **5**; robo por turno **0** (cada jugador gasta sus 5 cartas; la ronda termina con ambas manos vacías) |
| D-09 | ¿Qué pasa al terminar la ronda? | Rebarajar descarte y robar mano nueva de 5 |
| D-10 | ¿Stunned puede dejar el pool en 0? | No, mínimo 1 dado |
| D-11 | Despliegue inicial | Posiciones fijas del escenario base (sin fase de despliegue en el MVP) |
| D-12 | ¿El defensor puede quedar Stunned? | No, solo recibe la herida |
| D-13 | Umbrales de explosión | Por defecto explota el 10; con Técnica Explosión explota 9–10; tope de cadena por defecto 20 |
| D-14 | Disipar: qué anula | Anula la técnica defensiva activa si la hay; si no, reduce 1 dado guardado (mín 1). Nunca ambos efectos |
| D-16 | Reflujo: cómo se resuelve | En dos pasos (`combatePendiente` + `REFLEJAR_DADOS`); el RNG solo se consume dentro de intenciones |
| D-17 | Tope de cadena de explosión | Un dado explotado se repite hasta **nivel de Foco** veces (sustituye el tope fijo 20) |
| D-18 | Activación gratuita | Canal genérico **sin disparador** en el MVP; explosión como disparador queda a futuro |
| D-19 | Ataque gratuito | No cuenta en el contador de acciones ni consume PO; cierra igual la activación |
| D-20 | Replay | `estado.secuencia` registra `{ tipo, jugador, ...payload }` por intención aplicada |
| D-21 | Export | JSON `{ semilla, reglas, secuencia }` + módulo de métricas que lee el log |
| D-22 | Panel de ajustes | Expone solo flags cableados (D-05, D-12 y `roboPorTurno`) |
| D-23 | Stunned −1 dado guardado | Flag `stunnedReduceKept` (default `false`): Stunned resta 1 al keep (mín 1) |
| D-24 | Cambio de reglas en caliente | Vía intención `CAMBIAR_REGLAS` con validación y evento de log |

Reglas de balance aprobadas (05/08/2026):

| Regla | Decisión |
|---|---|
| A-11-N1 `reyProtegidoRonda1` | El Rey **no puede ser objetivo de ataque** en la Ronda 1 (garantiza mínimo una ronda de juego) |
| A-11-N2 | Rango del **Caballo 1 → 3** y del **Alfil 3 → 2** (reequilibrio de plantilla) |
| A-11-N3 `costesAccion` | Curva de acciones **1/2/3/5** conmutable |
| A-11-N4 `stunnedDuro` | Stunned reduce 1 dado del pool **y** 1 del keep (cada uno mínimo 1). Prevalece sobre D-23 cuando ambos están activos. Default `false` |
| A-11-N5 `retrocesoDefensorDiferencia2` | Ganar por diferencia ≥ 2 empuja 1 hex al defensor además de la herida. Default `false` |
| A-11-N6 `tecnicasUnaPorRonda` | Una sola Técnica por ronda por unidad. Default `true` |

## 7. Contenido actual del juego (datos exactos)

### 7.1 Arquetipos (valores post-ajuste, vigentes)

Unidades asimétricas; la analogía de ajedrez es funcional, **no** reglas de ajedrez.

| Arquetipo | Mov | Ataque | Defensa | Vida | Rango | Foco | Rol funcional |
|---|---|---|---|---|---|---|---|
| Peón | 3 | 1g1 | 1g1 | 2 | 1 | 1 | Infantería básica, melee, sacrificable |
| Alfil | 4 | 2g1 | 1g1 | 2 | **2** | 2 | Tirador a distancia / escaramuza |
| Torre | 2 | 2g1 | 2g1 | 4 | 1 | 1 | Tanque defensivo, lento |
| Caballo | 5 | 2g1 | 1g1 | 3 | **3** | 1 | Flanqueador móvil de proyección |
| Campeón | 4 | 2g2 | 2g1 | 4 | 2 | 3 | Élite, portador de Técnicas |
| Rey | 3 | 1g1 | 2g2 | 4 | 1 | 2 | Condición de victoria, defensivo |

> **Regla de diseño crítica sobre el Keep:** subir el **Keep** (guardar 2 dados) es **mucho** más
> potente que subir el pool, porque suma dos dados (~11 de media vs ~5,5 de uno). En el MVP la
> mayoría usa Keep 1; el Keep 2 se reserva al **Campeón** (ofensivo) y al **Rey** (defensivo) como
> palancas caras y raras. **No repartir Keep 2 con liviandad** — vuelve el combate determinista.

### 7.2 Facciones y mazos

- **Facción A = Fuego = Clan Husky** (negro y rojo, `#e94560`).
- **Facción B = Agua = Clan Poodle** (blanco, rosa y dorado, `#3498db`).
- Ambas bandas: 5 unidades + 1 Rey (6 miniaturas), compuestas por los 6 arquetipos.
- **Mazo de 15 cartas por facción**, idéntico en estructura: **5 elementos × 3 valores (1/2/3) × 1
  ejemplar**. Es decir, en el mazo hay una carta `🔥1`, una `🔥2`, una `🔥3`, una `💧1`… etc.
- En el MVP las facciones **no rompen la simetría del mazo** (FR-063 pide asimetría de composición
  y/o mezcla de cartas, pero hoy la asimetría real está en la plantilla de unidades y en la
  identidad de las Técnicas).

### 7.3 Técnicas (catálogo mínimo, vigente)

| Técnica | Coste | Arquetipos | Efecto |
|---|---|---|---|
| Explosión | 🔥🔥 | Peón, Campeón | Este ataque: +1 dado al pool y los dados explotan con 9–10 (no solo 10) |
| Doble Tiro | 🌪️💧 | Alfil | Un ataque a distancia impacta a **dos objetivos adyacentes entre sí** |
| Muro | 🌍🌍 | Torre | Hasta su próxima activación, **+1 dado guardado** en Defensa (Keep +1) |
| Reflujo | 💧💧 | Alfil, Campeón | Tras tirar el Ataque, **repetir** cualquier cantidad de dados, una vez |
| Disipar | ◼️◼️ | Campeón | Anula la Técnica defensiva del objetivo o le resta 1 dado guardado |

**Pago mixto:** si la Técnica pide más tokens que el Foco de la unidad, el excedente se cubre con
**una carta del elemento correcto jugada en el momento** (esa carta no genera PO ni cuenta como la
carta obligatoria del turno).

**Reglas de Técnicas relevantes para propuestas de cartas:**
- Una Técnica se declara junto con la acción Atacar, antes de tirar (D-03).
- Se paga con tokens guardados; la carta solo cubre el excedente sobre la capacidad de Foco.
- **Una Técnica por ronda por unidad** (A-11-N6).
- Catálogo completo (≈20, cuatro por elemento) es 🔴 diferido.

### 7.4 Escenario base (vigente)

- Tablero hexagonal con **radio 4** (hexágonos de centro (0,0) a distancia ≤ 4).
- **Sin hexágonos bloqueados** en el escenario base.
- **Despliegue fijo** por facción (D-11), sin fase de despliegue:

```
Facción A: (-2,2) (-1,2) (-2,1) (-1,1) (-2,0)
Facción B: ( 2,-2) ( 1,-2) ( 2,-1) ( 1,-1) ( 2,0)
```

Coordenadas axiales `(q, r)`. A y B se enfrentan simétricamente a ambos lados del centro.

### 7.5 Referencias visuales y tono

Arte en **16-bit pixel art** estilo JRPG táctico clásico (Final Fantasy Tactics / Breath of Fire
3), ambientación **feudal japonesa fantástica**. **A = Fuego = Clan Husky** (negro/rojo), **B =
Agua = Clan Poodle** (blanco/rosa/dorado). Archivos de referencia en `docs/referencia-visual/`:
- `Ref001.jpg`…`Ref004.jpg` — referencias de tono/estilo generales.
- `Estandar.jpg` — estándar de composición del sprite (personaje de pie, 128×128, pies cerca del
  borde inferior).
- `pic*.webp` — referencias adicionales de escenario/fondo.

Mapa/UI previsto: fondo tipo mapa táctico de pergamino envejecido, tiles de prado tipo jardín zen
japonés con pétalos de sakura, tile bloqueado de ruinas de piedra cubiertas de musgo y bosque de
bambú. **La identidad nunca depende solo del arte**: anillo de facción, pips de vida y slots de
Foco siempre visibles.

## 8. Balance: watch points y hallazgos medidos

### Watch points (cosas a vigilar, no bugs)

1. **Keep 2 dominante** — que Campeón/Rey no vuelvan trivial el combate.
2. **Curva de acciones** — que la 4ª acción (5 PO) exista con 1 carta por turno (hoy es un hito
   raro, y eso es consistente con el diseño).
3. **Foco escalonado vs. mazo chico** — cargar una Técnica de 2 tokens (4 PO) exige normalmente
   dos turnos; verificar que el ritmo se sienta bien y no frustrante.
4. **Asimetría de tempo** — la ronda que termina con ambas manos vacías premia retener cartas;
   vigilar el *hoarding*.
5. **Muerte del Rey anticlimática** — combate *swingy* + explosiones; el Rey ya está protegido en
   ronda 1 (A-11-N1) y lleva Vida 4 / Defensa 2g2, pero sigue siendo el foco del rush.
6. **Efecto de Stunned** — medir si −1 dado es castigo suficiente o excesivo.

### Hallazgos de simulación (3000 partidas con bots; datos reales)

> Nota de método: la campaña original (04/08) se corrió con robo=1 y curva 1/3/5/9. Tras los
> ajustes del 05/08 (D-08 robo=0, A-11-N1/N2/N3) se re-corrió la simulación. Cualquier propuesta de
> contenido debe razonarse contra estos números.

| Hallazgo | Evidencia | Estado |
|---|---|---|
| **H1 — Plantilla de Agua ganaba 81–95%** | La banda Agua tenía Alfil (rango 3) + Campeón (Keep 2 ofensivo); Fuego, Torre lenta y Caballo melee que no llegaba a pelear | **Cerrado**: A-11-N2 (Caballo rango 3, Alfil rango 2). Victoria de Fuego 8% → 31% (codicioso) y 19% → 44% (aleatorio) |
| **H2 — Rey moría en ronda 1 (87% jaque mate)** | Partida codicioso p50 = ronda 1.49; muerte del Rey en ronda 1 | **Cerrado**: A-11-N1 (Rey protegido en Ronda 1). Muerte del Rey ya no ocurre en ronda 1 (p50 = ronda 3) |
| **H3 — Curva 1/3/5/9 muerta** | 2ª/3ª/4ª acción pagadas = 0 en casi todas las configs | **Cerrado**: A-11-N3 (curva 1/2/3/5). La 2ª acción pasó de 0 → 1.9–4.8 y la 3ª de 0 → 3.4–4.7 por partida (codicioso/ahorrador y aleatorio); la 4ª (5 PO) sigue siendo rara (0) — consistente con el diseño |
| **H4 — Defender era mejor que atacar** | Atacante gana < 50% en todas las configs salvo hoarding | **Mitigado parcialmente**: A-11-N5 (retroceso del defensor con diferencia ≥ 2, default `false`). Medición diferida al playtest manual |
| **H5 — Stunned es un impuesto bajo** | Atacante Stunned gana ~10 pp menos; no se sentía como decisión táctica | **Mitigado parcialmente**: A-11-N4 (`stunnedDuro`, default `false`). Medición diferida al playtest manual |

**Consecuencias directas para el diseño de contenido (léelas antes de proponer):**
- La **economía real por turno es 1–3 PO** (una carta por turno, valores 1–3, sin robo). Cualquier
  propuesta de cartas o de economía que asuma más de 3 PO disponibles por turno está fuera del
  flujo actual.
- El **Keep 2 es intocable fuera de Campeón/Rey**. Una carta o habilidad que otorgue +1 dado
  guardado a cualquiera es una palanca de balance altísima; debe justificarse.
- El **Rey protegido en ronda 1** es una regla de garantía mínima; proponer "reducir protección" es
  reabrir H2.
- El Foco **florece cuando la partida dura** (12–13 tokens en partidas largas vs 0.4 en el rush):
  las propuestas de cartas que aceleran Foco deben vigilar no romper ese ritmo.
- **Telemetría por arquetipo disponible (US-106):** `sim/metricas.js` ya desglosa por arquetipo y por
  facción daño hecho/recibido, veces atacando/defendiendo, derrotas, rondas sobrevividas, técnicas y
  foco. Se reporta en `sim/reporte.js` (CLI) y en el panel del navegador. Úsala para justificar
  cualquier propuesta que toque un arquetipo concreto: si un arquetipo hace más daño que el que
  recibe, pedirle "más potencia" reabre el desequilibrio que la telemetría mide.

---

# PARTE 3 — Qué se pide y cómo devolverlo

## 9. Briefs por dominio

Cada brief: **qué hay hoy → qué se pide → restricciones (qué NO se puede violar)**.

### Brief 1 — Worldbuilding

**Qué hay hoy.** Identidad de facciones elemental: Fuego = Clan Husky (negro/rojo, agresión), Agua =
Clan Poodle (blanco/rosa/dorado, adaptación). Arquetipos con rol funcional de ajedrez (Peón =
asígaru, Alfil = arquero, Torre = tanque pesado, Caballo = jinete acorazado, Campeón = ronin élite,
Rey = shōgun/daimyō). Ambientación feudal japonesa fantástica, arte 16-bit JRPG. **No existe**
narrativa escrita (historia, trasfondo, geografía, por qué se enfrentan Husky y Poodle, por qué los
cinco elementos).

**Qué se pide.** Propuestas de worldbuilding que **conviertan el sistema mecánico en un mundo
coherente y vendible**, como mínimo:
- Trasfondo de las dos facciones y el conflicto que las enfrenta (justifica la escaramuza).
- Razón diegética de los **cinco elementos** y su asociación mecánica.
- Identidad narrativa por **arquetipo** (qué significa ser un Alfil en cada clan) y por Técnica.
- Cómo se refleja el **deckbuilding** en la ficción (¿qué son las cartas dentro del mundo?).

**Restricciones.**
- No cambiar elementos, facciones, arquetipos ni mecánicas; el worldbuilding es **capa narrativa
  sobre lo existente**.
- Puede proponer nombres propios, geografía, unidades adicionales para la 4X, pero **no puede
  repartir Keep 2** ni tocar perfiles numéricos (eso es balance, no worldbuilding).
- El tono debe ser compatible con pixel art JRPG clásico y feudal fantástico; evitar grimdark
  extremo y anacronismos modernos.

### Brief 2 — Nuevas cartas (deckbuilding)

**Qué hay hoy.** Mazo de 15 cartas (5 elementos × valores 1–3, un ejemplar). Toda carta se juega
como Orden (genera PO de su elemento). Sin cartas especiales: sin efectos de carta, sin equipos, sin
recursos. Deckbuilding (compra/mercado) es 🔴 diferido, pero **las cartas del mazo base pueden
diseñarse**.

**Qué se pide.** Propuestas de **cartas nuevas para el mazo base** (no mecánicas de compra todavía),
cada una con: **elemento, valor de Orden (1–3), y función** (efecto al jugarse). Ideas dentro del
lenguaje mecánico único (sección 3): +1 dado, +1 dado guardado, repetir dado, explotar dados,
almacenar energía, convertir elementos, habilitar Técnicas.

**Restricciones.**
- El efecto de una carta **debe respetar el flujo PO**: las cartas se juegan para generar PO y un
  efecto opcional; el PO no persiste entre turnos.
- **No romper la regla de oro del Keep**: nada de dar +1 dado guardado gratis a cualquier unidad.
- Los valores de Orden deben seguir siendo 1–3 para que el mazo encaje en el ciclo económico actual.
- Prohibido proponer Equipo/Recurso (🔴 diferido) salvo que se marque explícitamente como extensión.
- Cada carta debe tener una **razón de balance**: por qué su coste y su efecto valen lo mismo.

### Brief 3 — Río de cartas / economía

**Qué hay hoy.** Mano inicial 5, robo por turno **0**. Una carta obligatoria por turno. La ronda
termina cuando ambas manos quedan vacías (quien se queda sin cartas cede el turno; el otro sigue en
solitario). Fin de ronda: rebarajar descarte y robar mano nueva. PO no persisten entre turnos.
Deckbuilding de compra/mercado: 🔴 diferido.

**Qué se pide.** Propuestas de diseño de **flujo de cartas** (el "río") que hagan la economía más
interesante **dentro del MVP**, por ejemplo: mecanismos de robo condicional, qué sucede con la
asimetría de tempo (hoarding), variantes de fin de ronda, usos alternativos de la carta obligatoria
del turno, o propuestas de mano inicial/robo. **Puede proponer cambiar valores de arranque (D-08,
D-09), pero debe marcarlo como propuesta de regla conmutable con justificación basada en los
hallazgos H3/H4 y el watch point de asimetría de tempo.**

**Restricciones.**
- Toda propuesta de regla debe ser **conmutable** (flag), nunca hardcodeada.
- No puede romper el determinismo del motor ni exigir decisiones que el motor no pueda representar
  como intención.
- La propuesta debe razonarse contra: economía real de 1–3 PO por turno, curva 1/2/3/5, y el riesgo
  de premio excesivo al *hoarding*.
- Prohibido introducir compra de cartas/mercado (🔴 diferido) sin marcarlo como extensión 4X.

### Brief 4 — Disposición de tablero

**Qué hay hoy.** Tablero de radio 4, **sin hexágonos bloqueados**, despliegue fijo simétrico
(A a la izquierda, B a la derecha; 5 posiciones por facción). Sistema de escenarios separado del
núcleo de combate. La acción Interactuar existe como placeholder genérico.

**Qué se pide.** Propuestas de **escenarios** y **disposición del tablero** que hagan más
interesante la escaramuza base: configuraciones de hexágonos bloqueados (terreno), variantes de
despliegue, posiciones de objetivos para Interactuar, reglas de escenario con condiciones de
victoria alternativas.

**Restricciones.**
- Coordenadas axiales `(q, r)` en hexágonos; distancia máxima 4 desde el centro.
- Los bloqueados son celdas **no transitables**; las unidades no los atraviesan y obstruyen la LoS
  (regla del borde). No hay terreno "a medias" en el MVP.
- Las reglas de escenario **no pueden modificar reglas del núcleo de combate** (se mantienen
  separadas). Pueden proponer nuevas condiciones de victoria, pero la victoria por eliminación total
  o muerte del Rey siempre debe seguir siendo válida.
- El despliegue fijo del escenario base puede variar **por escenario**, no por regla global.
- Las posiciones deben ser legalmente alcanzables (hexágonos dentro del radio, sin colisión de
  unidades al desplegar).

## 10. Reglas de oro para el agente (restricciones duras)

1. **No inventes reglas.** Si algo no está en este documento, es una decisión abierta: proponé un
   valor de arranque, marcá el ID (D-XX / A-11-NX / nuevo) y **preguntá** en el documento de
   respuesta. No lo resuelvas en silencio.
2. **Respetá las reglas congeladas.** Las de la sección 5 no se tocan sin justificación explícita.
   Todo cambio propuesto va como **decisión abierta conmutable**, nunca como "ya quedó así".
3. **No repartas Keep 2.** Es la palanca de balance más poderosa del sistema; queda para Campeón
   (ataque) y Rey (defensa).
4. **Economía real = 1–3 PO por turno.** Cualquier propuesta de cartas/economía que asuma más
   disponible por turno está fuera del flujo actual del MVP.
5. **Determinismo.** El motor debe poder reproducirse con misma semilla + misma secuencia. Las
   propuestas no pueden exigir azar "ambiental" que rompa el replay.
6. **Trazabilidad.** Cada propuesta debe poder enlazarse a un FR existente o a una necesidad nueva
   explícitamente marcada. Sin FR y sin marca de extensión, la US está incompleta.
7. **MoSCoW claro.** Marcá si tu propuesta es **Must** (imprescindible para una partida completa
   del MVP), **Should**, **Could** o **Won't-now** (documentar para 4X). El MVP está congelado en
   alcance: casi todo el contenido nuevo que propongas será S/C o 🔴 4X, y eso está bien.
8. **Formato de salida.** Todo diseño se entrega como Característica Gherkin según la sección 11.
   Sin narrativa suelta: la justificación va en el documento de respuesta (sección 13).

## 11. Plantilla de salida Gherkin

Gherkin en español. El archivo empieza con `# language: es`. Palabras clave: `Característica`,
`Contexto`, `Escenario`, `Esquema del escenario`, `Ejemplos`, `Dado`, `Cuando`, `Entonces`, `Y`,
`Pero`.

```gherkin
# language: es

@epica-XX @dominio
Característica: US-0xx — [título corto]

  Como [rol]
  quiero [comportamiento]
  para [beneficio]

  Cubre FR-XXX. [y FR-YYY si aplica] [o: "Cubre necesidad nueva (extensión): …"]

  Contexto:
    Dado [estado inicial mínimo]

  @must @FR-XXX
  Escenario: [qué comportamiento se prueba]
    Dado [premisa concreta y numerada]
    Cuando [acción del jugador]
    Entonces [resultado observable y verificable]
    Y [resultado secundario, si aplica]

  @must @FR-XXX
  Escenario: [caso negativo — la misma acción se rechaza]
    Dado [premisa]
    Cuando [intenta la acción inválida]
    Entonces [la acción no se aplica]
    Y [no hubo efectos parciales: sin PO consumidos, sin contador incrementado, sin estado modificado]
```

**Reglas de escritura de escenarios:**
- **Testeable.** "el combate se siente tenso" no es un criterio; "el empate resuelve idéntico a
  victoria del defensor" sí.
- **Un comportamiento por escenario.** Si el `Entonces` tiene tres verbos sin relación, son tres
  escenarios.
- **Con su caso negativo.** Cada acción que se ejecuta tiene un escenario donde se rechaza.
- **Sin implementación adentro.** El escenario dice qué pasa, no qué función se llama.
- **Con números concretos.** "cuesta 3 PO", no "cuesta más".
- **Tags obligatorios por escenario:** `@must`/`@should`/`@could`/`@wont` y `@FR-XXX`. Un escenario
  sin `@FR-…` es sospechoso: o falta el requerimiento, o el escenario está de más.

**Convenciones de numeración de US nuevas:** el backlog va de US-000 a US-102 en épicas `@epica-0`
a `@epica-10`; el rango 103–199 quedó reservado para el cierre del MVP y ya se usaron US-104
(screen shake), US-105 (sprites) y US-106 (métricas por arquetipo). Las US de contenido nuevo que
traigas deben numerarse **desde US-200 en adelante** y usar épicas nuevas `@epica-11` en adelante,
con dominio (`@worldbuilding`, `@cartas`, `@economia-cartas`, `@escenarios`). No renumerar historias
existentes.

## 12. US modelo (ejemplo de nivel de calidad esperado)

### 12.1 Modelo worldbuilding

```gherkin
# language: es

@epica-11 @worldbuilding
Característica: US-200 — Trasfondo del conflicto entre el Clan Husky y el Clan Poodle

  Como jugador
  quiero que el enfrentamiento tenga un trasfondo narrativo coherente
  para que el mundo detrás del tablero se sienta real y vendible.

  Cubre necesidad nueva (extensión de worldbuilding): no modifica mecánicas.

  @must
  Escenario: El trasfondo conecta facción y elemento
    Dado que el mundo tiene dos clanes enfrentados: el Clan Husky (Fuego, negro y rojo) y el Clan Poodle (Agua, blanco y rosa)
    Cuando el jugador abre la pantalla de preparación
    Entonces cada facción muestra un texto de trasfondo de entre 2 y 4 oraciones
    Y ese texto justifica por qué esa facción representa su elemento (Fuego = agresión, Agua = adaptación)
```

> Los escenarios de worldbuilding son verificables a mano (texto visible), no con tests de motor.

### 12.2 Modelo nuevas cartas

```gherkin
# language: es

@epica-11 @cartas
Característica: US-201 — Carta de mazo base con efecto de almacenar energía

  Como jugador
  quiero jugar una carta que no solo genere PO sino que además alimente el Foco
  para que el presente (PO) compita contra el futuro (energía para Técnicas).

  Cubre FR-010, FR-013, FR-021.

  Contexto:
    Dado un jugador con Foco disponible en una de sus unidades

  @should @FR-010 @FR-021
  Escenario: La carta se juega como Orden y guarda un token adicional
    Dado que el jugador juega una carta de Fuego valor 2 con efecto "guarda 1 token de Fuego en una unidad aliada adyacente a un PO de Fuego"
    Cuando el jugador elige la unidad objetivo y ejecuta la carta
    Entonces se generan 2 PO de Fuego
    Y la unidad objetivo guarda 1 token de Fuego
    Y la carta va al descarte

  @should @FR-021
  Escenario: El efecto de almacenar energía se rechaza sin Foco disponible
    Dado que todas las unidades del jugador tienen el Foco lleno
    Cuando el jugador intenta usar el efecto de almacenar energía de la carta
    Entonces el efecto de la carta no se aplica
    Y los 2 PO de Fuego sí se generan (la carta se juega igual como Orden)
```

> Nota: este es un ejemplo de FORMA. El efecto real (qué carta, qué coste, qué condición) es lo que
> se te pide diseñar y justificar.

### 12.3 Modelo río de cartas / economía

```gherkin
# language: es

@epica-11 @economia-cartas
Característica: US-202 — Robo condicional de una carta al eliminar una unidad enemiga

  Como jugador
  quiero que eliminar unidades enemigas tenga una pequeña recompensa de cartas
  para que agredir compita contra la táctica de retener mano.

  Cubre D-08 (propuesta de extensión conmutable), FR-010, FR-092.

  Contexto:
    Dado un escenario de partida en curso
    Dado que la regla conmutable "roboCondicionalEliminacion" está activada

  @should @FR-092
  Escenario: Eliminar una unidad enemiga otorga robar una carta
    Dado que el mazo del jugador tiene al menos 1 carta
    Cuando el jugador elimina una unidad enemiga
    Entonces el jugador roba 1 carta de su mazo
    Y esa carta se agrega a su mano

  @should
  Escenario: Sin cartas en el mazo, la recompensa se ignora
    Dado que el mazo del jugador está vacío
    Cuando el jugador elimina una unidad enemiga
    Entonces no se roba ninguna carta
    Y no se altera el estado de la partida
```

### 12.4 Modelo disposición de tablero

```gherkin
# language: es

@epica-11 @escenarios
Característica: US-203 — Escenario con hexágonos bloqueados y despliegue alternativo

  Como jugador
  quiero que exista un segundo escenario con terreno bloqueado
  para que la escaramuza varíe en posiciones y cobertura.

  Cubre FR-040, FR-043, FR-057.

  Contexto:
    Dado el escenario "garganta" con radio 4
    Dado que los hexágonos (-1,0) y (1,0) están bloqueados

  @must @FR-043
  Escenario: La línea de visión se bloquea por un hexágono ocupado en el trayecto
    Dado un tirador en (-2,0)
    Dado un objetivo en (2,0)
    Cuando el tirador intenta atacar a distancia
    Entonces el ataque no se permite por falta de LoS
    Y no se consume PO de ataque

  @must @FR-040
  Escenario: Las unidades no pueden entrar en un hexágono bloqueado
    Dado una unidad adyacente a (-1,0)
    Cuando esa unidad intenta moverse a (-1,0)
    Entonces el movimiento no se ejecuta
    Y la unidad permanece en su posición
```

## 13. De vuelta a nosotros (formato del documento de respuesta)

Devolvé tus recomendaciones como un documento estructurado así:

```
# Recomendaciones de diseño — Escaramuza [fecha]

## Resumen ejecutivo (5-10 líneas)
Qué proponés en total y qué impacto esperás en los hallazgos/watch points.

## Por dominio (uno por dominio trabajado)
### Dominio: [worldbuilding | cartas | economía | tablero]
- Recomendación 1
  - Justificación (corta, anclada a secciones 5-8)
  - Riesgo/balance que toca (Keep 2, economía 1-3 PO, curva 1/2/3/5, tempo, Rey, Stunned)
  - MoSCoW: [M | S | C | W/4X]
  - Característica Gherkin (sección 11): [la US completa]
- Recomendación 2 … 

## Decisiones abiertas nuevas (preguntas que me dejás al dueño)
- ID propuesto (D-25…, A-11-N7…): [pregunta] → [valor de arranque propuesto] → [qué medir]

## Reglas congeladas que proponés tocar (si alguna)
- [regla] → [cambio propuesto] → [por qué es necesario]
```

Reglas del documento de respuesta:
- **Una US completa por propuesta**, no un resumen de propuestas y luego las US aparte.
- **No escribas código.** Esto es diseño de contenido y reglas; la implementación se decide después
  en el repo.
- **No mezcles dominios** dentro de una US: si tu propuesta toca cartas y economía a la vez, son dos
  US.
- Si tenés dudas sobre una regla no cubierta acá, **preguntala explícitamente** en "Decisiones
  abiertas nuevas" en vez de resolverla.
