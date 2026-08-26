# Documento Maestro de Diseño — Sistema de Juego (GDD)
### Memoria de diseño y estado del prototipo

**Nombre de trabajo:** Escaramuza (motor táctico)
**Estado:** Pre-alpha / Prototipo de escaramuza
**Última actualización:** integra las decisiones tomadas sobre combate, Foco, ronda, unidades y victoria.
**Propósito:** consolidar en un único documento las decisiones tomadas, separar reglas acordadas de propuestas y dejar identificados los puntos pendientes.

> Convención de estado usada en todo el documento:
> 🟢 **DECIDIDO** — regla firme para el MVP.
> 🟡 **PROPUESTO / EN TESTING** — valor de arranque a validar en playtest.
> 🔴 **DIFERIDO** — fuera del MVP; se desarrolla en la fase 4X.

---

## 1. Visión del proyecto

Juego de mesa táctico de escaramuzas con deckbuilding, para partidas de aproximadamente **4–6 miniaturas por jugador**.

El sistema combina combate táctico, activación de unidades mediante cartas, gestión de energía elemental, personalización por deckbuilding y unidades asimétricas. Se concibe además como **motor reutilizable** para un juego 4X/táctico posterior, pero el prototipo actual valida primero el **núcleo de escaramuza**.

Filosofía central:
- Cada carta es una **decisión estratégica**, no un efecto aislado.
- Una carta puede convertirse en poder inmediato (Orden), mejora permanente (Equipo) o progreso económico (Recurso).
- La mejor jugada **no** debe ser obvia por el valor numérico de la carta: una carta de 1 PO puede valer más que una de 3 según su elemento, momento y función.

---

## 2. Principios de diseño

**2.1. Cartas multifunción.** Una carta no debe tener una única función óptima siempre. El jugador elige entre resolver el presente, mejorar una unidad, generar progreso económico o almacenar energía elemental. Tensión buscada: **presente vs. futuro**.

**2.2. Un único lenguaje mecánico.** Cartas iniciales y cartas de deckbuilding usan el mismo vocabulario (+1 dado, +1 dado guardado, repetir dado, explotar dados, almacenar energía, convertir elementos, habilitar Técnicas, etc.). No hay minijuegos separados.

**2.3. Fluidez para acciones básicas, especificidad para Técnicas.** Los PO sirven para acciones básicas **sin importar su elemento**. Las Técnicas y efectos avanzados **sí** exigen elementos concretos. Resultado: fluidez táctica + identidad elemental.

---

## 3. Arquitectura del sistema

```
             DECKBUILDING
                  │
                  ↓
              CARTA
                  │
        ┌─────────┼─────────┐
        ↓         ↓         ↓
      ORDEN     EQUIPO    RECURSO 🔴
        │         │         │
        ↓         ↓         ↓
       PO       UNIDAD   CONSTRUCCIÓN 🔴
        │
        ↓
     ACTIVACIÓN
        │
   ┌────┼────┐
   ↓    ↓    ↓
 MOVER ATACAR FOCO
              │
              ↓
       ENERGÍA ELEMENTAL
              │
              ↓
           TÉCNICA
              │
              ↓
        D10 ROLL & KEEP
              │
              ↓
          COMBATE
```

En el MVP están activas las ramas **Orden → PO → Activación → (Mover / Atacar / Foco) → Técnica → Combate**. Las ramas Equipo, Recurso y Construcción quedan diferidas (ver §12).

---

## 4. Elementos 🟢

Cinco elementos: 🔥 Fuego · 💧 Agua · 🌪️ Aire · 🌍 Tierra · ◼️ Vacío.

Son el lenguaje que conecta cartas, PO, Foco, Técnicas y modificaciones de combate.

**Dirección de identidad elemental** (🟡 tendencias, no tabla cerrada):

| Elemento | Tendencia mecánica |
|---|---|
| 🔥 Fuego | explosiones, daño, agresión |
| 💧 Agua | rerolls, manipulación de resultados, adaptación |
| 🌍 Tierra | Keep, defensa, resistencia |
| 🌪️ Aire | Dice Pool, movilidad, precisión |
| ◼️ Vacío | alterar reglas, conversión, efectos excepcionales |

---

## 5. Cartas 🟢 (estructura) / 🟡 (distribución)

**Mazo inicial:** 15 cartas por facción.
**Estructura idealizada de prototipo:** 5 elementos × 3 valores de Orden (1/2/3 PO), un ejemplar de cada = 15. Las facciones podrán romper esta simetría más adelante.

Cada carta tiene como mínimo: **elemento** + **valor de Orden (1–3 PO)**. Ej.: `🔥 3` = carta de Fuego que genera 3 PO al jugarse como Orden.

> **Nota de alcance:** las cartas de deckbuilding que se incorporen más adelante otorgarán **más PO** y funciones adicionales. El mazo del MVP es deliberadamente chico y de bajo valor para probar lo básico.

---

## 6. Funciones de las cartas

- **Orden** 🟢 — genera tantos PO como su valor; la carta se descarta.
- **Equipo** 🔴 — mejora permanente sobre una unidad. **Fuera del MVP.**
- **Recurso** 🔴 — alimenta economía/construcciones. **Fuera del MVP.**

En el MVP **toda carta se juega como Orden**.

---

## 7. Puntos de Orden (PO) 🟢

Los PO son el recurso **inmediato** para activar unidades. Tienen valor y elemento.

**Ciclo de vida (MVP):**
- Se generan al jugar una carta como Orden, en el turno.
- Se gastan ese mismo turno en acciones o se convierten en tokens de Foco.
- **No se acumulan como bolsa flotante ni expiran por contador**: el PO no convertido a Foco al terminar el turno, se pierde. El único depósito persistente es el Foco de cada unidad.
- Las acciones básicas aceptan PO de **cualquier** elemento; las Técnicas exigen elemento específico.
- Una unidad puede recibir PO/energía **de varias fuentes en el mismo turno** (farmeo propio + pasiva de un compañero), sin superar su capacidad de Foco.

---

## 8. Acciones básicas 🟢

Cuatro acciones: **Mover, Atacar, Interactuar, Foco (Concentrarse)**.

**Coste progresivo por unidad** dentro de una misma ronda/activación: 1ª acción = **1 PO**, 2ª = **3 PO**, 3ª = **5 PO**, 4ª = **9 PO**. Contador **individual** por unidad.

> ⚠️ **Observación de balance (MVP):** con 1 carta por turno y valores 1–3 PO, los tramos 5 y 9 casi nunca se disparan. La diferenciación real entre unidades en el MVP proviene sobre todo del **pool de dados**, no de encadenar acciones. La curva 1/3/5/9 queda documentada y recién será relevante cuando entren cartas de mayor PO (deckbuilding).

**8.1. Mover** — se desplaza hasta su valor de Movimiento. No atraviesa hexágonos ocupados ni bloqueados.

**8.2. Atacar** — melee o a distancia; se resuelve con D10 Roll & Keep. **Tras Atacar, la unidad no puede volver a activarse ese turno** (evita mover→atacar→mover→atacar).

**8.3. Interactuar** — explorar, capturar, recoger, abrir, activar mecanismos, etc. Depende del escenario.

**8.4. Foco (Concentrarse)** — convierte PO en tokens de energía elemental almacenados en la reserva de la unidad. Ver §9.

---

## 9. Foco 🟢

**Foco es un valor fijo de la unidad** (p. ej. Foco = 2) que indica **cuántos tokens elementales puede almacenar como máximo**. No se deriva de la Técnica.

**Coste escalonado por token** (misma escala que las acciones): 1er token = **1 PO**, 2º token = **3 PO**, 3er token = **5 PO**. Es decir, llenar una unidad de Foco 2 cuesta **1 + 3 = 4 PO** en total.

**Reglas:**
- Los tokens se guardan en la unidad; no se transfieren entre unidades (una habilidad futura podría permitirlo).
- Una unidad no supera su capacidad de Foco.
- Puede almacenar **elementos distintos** simultáneamente (necesario para Técnicas mixtas tipo 🌪️💧).
- Persistencia entre rondas: 🟡 a validar en playtest (propuesta de arranque: **los tokens persisten entre rondas** hasta gastarse, salvo efecto en contrario).

> **Nota de playtest — doble cobro:** definir si la acción Concentrarse consume además un paso del contador de acciones 1/3/5/9. **Recomendación MVP:** el coste escalonado de tokens **es** el coste; Concentrarse no incrementa el contador por separado.

---

## 10. Activación 🟢

Una activación pertenece a una unidad. Una carta puede aportar PO suficientes para activar varias unidades, y las activaciones pueden intercalarse mientras haya PO disponibles. El coste progresivo (1/3/5/9) se cuenta por unidad.

El jugador decide qué unidad activar y qué hacer con sus PO; se evita el rígido "un turno completo por unidad".

---

## 11. Movimiento, distancia, alcance y línea de visión 🟢

**Movimiento.** La unidad se mueve de hexágono adyacente a adyacente, en cualquier dirección, hasta su velocidad. No atraviesa hexágonos ocupados (amigos o enemigos) ni bloqueados.

**Medición de distancia.** Se cuenta cada hexágono desde el atacante hasta el objetivo (no necesita ser línea recta), empezando a contar desde un hexágono adyacente. Adyacente = a 1 hexágono.

**Alcance (Rango).** Se mide igual que el Movimiento: Rango 1 = unidades adyacentes; Rango 2…n = a 2…n hexágonos.

**Línea de visión (LoS).** Salvo regla en contrario, las unidades ven en todas direcciones. Se traza una línea recta del **centro** del hexágono atacante al **centro** del hexágono objetivo:
- Si la línea atraviesa un hexágono bloqueado u ocupado (amigo o enemigo), la LoS está **obstruida**.
- Si la línea solo toca el **borde** de un hexágono bloqueado/ocupado, **no** se considera obstruida.

---

## 12. Combate 🟢

**Sistema:** D10 Roll & Keep. Notación `XgY` = tirar X dados, guardar Y.

**Base:** Ataque **1g1**, Defensa **1g1**, modificados por el arquetipo de unidad (§13).

**Resolución (fase MVP — solo suma):**
1. El atacante tira su pool de Ataque y guarda su Keep.
2. El defensor tira su pool de Defensa y guarda su Keep.
3. Cada uno **suma** sus dados guardados.
4. Se comparan las sumas. **No hay conteo de éxitos ni dificultad en el MVP.**

**Resultado:**
- **Atacante saca más** → el defensor recibe **1 herida**.
- **Defensor saca más** → el atacante **retrocede 1 hexágono** y queda **Stunned**.
- **Empate** → gana la defensa: el atacante **retrocede 1 hexágono** y queda **Stunned**.

**Daño (MVP):** perder un combate = **1 herida**. No hay segunda tirada de daño. Cartas, Técnicas y habilidades podrán agregar daño extra o efectos más adelante.

**Dados explosivos 🟢:** un **10** explota → se tira un D10 nuevo y se suma; puede encadenar si el nuevo dado vuelve a explotar. Cartas y habilidades podrán modificar qué valores explotan y cuántas veces.

**Diferido para después del MVP-0:** críticos, cobertura, defensas/ataques especiales, ataques múltiples generales, dificultad, conteo de éxitos, iniciativa compleja.

---

## 13. Unidades — arquetipos y perfiles 🟡

Las unidades son **asimétricas** y se representan con miniaturas. Como clasificación funcional de arranque se usa una analogía de ajedrez (nombres = arquetipos, **no** reglas de ajedrez): **Peón, Alfil, Torre, Caballo, Campeón, Rey**.

Perfil mínimo de cada unidad: **Movimiento · Ataque (XgY) · Defensa (XgY) · Vida (2–4) · Rango (1–3) · Foco · Técnicas**.

**Defensa** se resuelve tirando su propio pool (p. ej. 1g1) y comparando contra la tirada de Ataque.

**Valores de arranque propuestos (a validar en playtest):**

| Arquetipo | Mov | Ataque | Defensa | Vida | Rango | Foco | Rol funcional |
|---|---|---|---|---|---|---|---|
| Peón | 3 | 1g1 | 1g1 | 2 | 1 | 1 | Infantería básica, melee, sacrificable |
| Alfil | 4 | 2g1 | 1g1 | 2 | 3 | 2 | Tirador a distancia / escaramuza |
| Torre | 2 | 2g1 | 2g1 | 4 | 1 | 1 | Tanque defensivo, lento |
| Caballo | 5 | 2g1 | 1g1 | 3 | 1 | 1 | Flanqueador móvil |
| Campeón | 4 | 2g2 | 2g1 | 4 | 1–2 | 3 | Élite, portador de Técnicas |
| Rey | 3 | 1g1 | 2g2 | 4 | 1 | 2 | Condición de victoria, defensivo |

> **Regla de diseño sobre el Keep (crítica para el balance):** subir el **Keep** (guardar 2 dados) es **mucho** más potente que subir el pool, porque suma dos dados (~11 de media vs ~5,5 de uno). Por eso, en el MVP **la mayoría de las unidades usa Keep 1** y la diferenciación viene por tamaño de pool. El Keep 2 se reserva para el **Campeón** (ofensivo) y el **Rey** (defensivo), como palancas caras y raras. Repartir Keep 2 con liviandad vuelve el combate determinista.

Mapa con ejemplos previos: el **Ashigaru** encaja como Peón/infantería ligera; el **Arquero** como Alfil.

---

## 14. Técnicas 🟢 (dentro del MVP, catálogo mínimo)

Las Técnicas son el principal mecanismo de diferenciación. Requieren combinaciones específicas de energía elemental almacenada en Foco.

**Pago de una Técnica:** gasta los tokens guardados en la unidad; si la Técnica pide **más** tokens que la capacidad de Foco de la unidad, la diferencia se cubre con **una carta del elemento correcto jugada en el momento**. Ej.: unidad con Foco 2 y Técnica de 3 tokens → usa 2 guardados + 1 aportado por carta.

**Activación (🟡 propuesta de arranque):** la Técnica se declara como parte de la acción que modifica (típicamente Atacar), consume los tokens y resuelve su efecto. Momento exacto, si consume acción propia y límites por ronda: a afinar en playtest.

**Catálogo mínimo del MVP (🟡 valores de arranque):**

| Técnica | Coste | Arquetipo | Efecto propuesto |
|---|---|---|---|
| Explosión | 🔥🔥 | Peón / Campeón | Este ataque: +1 dado al pool y los dados explotan con **9–10** (no solo 10). |
| Doble Tiro | 🌪️💧 | Alfil | Un ataque a distancia impacta a **dos objetivos adyacentes entre sí**. |
| Muro | 🌍🌍 | Torre | Hasta su próxima activación, **+1 dado guardado** en Defensa (Keep +1). |
| Reflujo | 💧💧 | Alfil / Campeón | Tras tirar el Ataque, **repite** cualquier cantidad de dados una vez. |
| Disipar (opcional) | ◼️◼️ | Campeón | Anula la Técnica defensiva del objetivo / reduce en 1 su dado guardado. |

Estas 4–5 Técnicas forman el vocabulario mínimo para que el Foco tenga payoff y sea testeable. El catálogo completo (≈20, cuatro por elemento) queda para iteraciones posteriores.

---

## 15. Estados 🟡

Para el MVP existe un estado básico: **Stunned**.

**Stunned (efecto provisional propuesto):** la próxima vez que la unidad tire dados (Ataque o Defensa), tira **un dado menos** (mínimo 1); luego se descarta el estado.

El resto del catálogo de estados (Berserk, Bleed, Blind, Poisoned, On Fire, etc.) es **vocabulario de inspiración**, no forma parte del reglamento del MVP. Se traducirán progresivamente al lenguaje propio (cartas + elementos + Técnicas + D10).

---

## 16. Ronda y turno 🟢

- **Jugador inicial:** se determina con **tirada de moneda**.
- **Turno:** jugar una carta → generar PO → distribuir PO → activar unidades → resolver acciones → fin del turno. Jugar carta es obligatorio: **no se puede pasar**.
- **Alternancia:** los jugadores alternan turnos.
- **Fin de ronda:** la ronda termina cuando **ambos** jugadores se quedan sin cartas en la mano. Si un jugador se queda sin cartas antes que el otro, el que aún tiene mano **continúa tomando turnos en solitario** hasta agotarla.
- **Activaciones gratuitas:** pueden existir por dados explotados, críticos, cartas o habilidades.
- **Unidades sin capacidad de actuar:** no debería ocurrir en el diseño actual.

> ⚠️ **Observación de balance (MVP):** como la ronda termina con **ambos** manos vacías, retener cartas para el final genera una **asimetría de tempo** (turnos encadenados sin oposición). Es un vector estratégico legítimo, pero hay que vigilar que no premie en exceso el *hoarding*. Watch point del playtest.

---

## 17. Condiciones de victoria 🟢

- Un jugador **pierde** si **todas** sus unidades son eliminadas.
- Un jugador **pierde inmediatamente** si su **Rey muere** (equivalente conceptual al jaque mate).

Los escenarios podrán agregar condiciones (controlar objetivos, capturar puntos, mantener posiciones, cumplir misiones). El sistema de escenarios se mantiene **separado** del núcleo de combate.

> Como el combate 1g1 + explosiones es *swingy*, un golpe afortunado temprano contra el Rey puede cerrar la partida de forma anticlimática. Por eso el Rey lleva **Vida alta y Defensa 2g2** (§13). Es valioso pero no debe quedar expuesto de un saque.

---

## 18. Prototipo físico 🟢

Se puede probar con componentes simples: mazos regulares, fichas/tokens (PO, Foco, heridas, Stunned), dados **D10**, miniaturas existentes, tablero de hexágonos y marcadores improvisados. Permite validar economía, PO, Foco, activaciones, Roll & Keep y Técnicas antes de producir componentes definitivos.

---

## 19. Diferido a la fase 4X 🔴

Fuera del MVP por decisión explícita:

- **Recursos** (madera, comida, hierro y su economía).
- **Construcciones** (coste, producción, efectos persistentes).
- **Influencia** (militar, política, religiosa).
- **Equipo** como función de carta.
- **Deckbuilding avanzado** (compra de cartas, mercado, evolución del mazo).
- **Economía de valor** (tabla de equivalencias 1 PO ≈ 1 acción, +1 Keep ≈ X PO, etc.).
- Catálogo completo de Técnicas, estados avanzados y combate avanzado (críticos, cobertura, ataques múltiples generales).

---

## 20. Estado del diseño (resumen)

### 🟢 DECIDIDO
Escaramuza con deckbuilding · 4–6 miniaturas · mazo inicial de 15 · 5 elementos · cartas 1–3 PO · cartas multifunción (en MVP solo Orden) · PO como motor de activación · 4 acciones básicas · coste 1/3/5/9 · Atacar cierra la activación de la unidad · Foco como valor fijo de almacenamiento, coste escalonado 1/3/5 · Técnicas mínimas dentro del MVP · combate D10 Roll & Keep, resolución por suma · perdedor recibe 1 herida · empate a la defensa (retroceso + Stunned) · dados explotan con 10 · Rango = Movimiento · LoS centro a centro con regla del borde · moneda para el inicial · no se puede pasar · ronda termina con ambas manos vacías · derrota por unidades eliminadas o por muerte del Rey.

### 🟡 PROPUESTO / EN TESTING
Perfiles y estadísticas de los 6 arquetipos · reparto de Keep · persistencia de tokens de Foco entre rondas · doble cobro de la acción Concentrarse · efecto exacto de Stunned · efectos y momento de activación de las Técnicas · distribución elemental por facción · asimetría de tempo por manos desiguales.

### 🔴 DIFERIDO (4X)
Recursos · Construcciones · Influencia · Equipo · deckbuilding avanzado · economía de valor · catálogo completo de Técnicas/estados/combate avanzado.

---

## 21. Próximos pasos de diseño

1. **Cerrar el Game Loop** con los valores de este documento y correr el primer playtest de las 5 preguntas (ver Alcance Funcional §Objetivo del primer playtest).
2. **Validar Foco** (coste escalonado, persistencia, pago mixto de Técnicas).
3. **Validar combate mínimo:** Ataque XgY vs Defensa XgY → suma → herida.
4. **Afinar los 6 perfiles** según resultados (sobre todo el reparto de Keep).
5. **Ampliar Técnicas** a ≈20 (cuatro por elemento) una vez que el ciclo básico se sienta divertido.
