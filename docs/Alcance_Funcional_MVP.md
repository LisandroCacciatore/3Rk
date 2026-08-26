# Alcance Funcional — MVP Motor de Escaramuza
### + Backlog de requerimientos funcionales (FR)

**Estado:** alcance congelado para el primer ciclo de playtest.
**Documento hermano:** `Memoria_Maestra_Diseño_Juego.md` (GDD — decisiones y racional).

---

## 1. Objetivo del MVP

Validar el **núcleo táctico** mediante una partida de escaramuza entre dos jugadores, comprobando la interacción:

`Mazo → PO → Activaciones → Acciones → Foco → Energía Elemental → Técnicas → Combate.`

El MVP **no** valida el 4X ni la economía completa. Determina si el núcleo táctico es divertido, comprensible, estratégico y suficientemente asimétrico.

---

## 2. Dentro del alcance

Dos facciones jugables · unidades diferenciadas (arquetipos de ajedrez) · mazo individual de 15 cartas por jugador · cartas de 1–3 PO · cinco elementos · sistema de PO · Foco (valor fijo, coste escalonado) · activación de unidades · cuatro acciones básicas · movimiento hexagonal · ataques melee y a distancia · medición de distancia y alcance · línea de visión · D10 Roll & Keep con dados explosivos · resolución por suma · vida/heridas · estado Stunned · catálogo mínimo de Técnicas (4–5) · victoria por eliminación total · victoria especial por muerte del Rey.

## 3. Fuera del alcance (diferido a 4X)

Recursos · Construcciones · Influencia · Equipo (como función de carta) · deckbuilding avanzado (compra/mercado) · economía de valor · catálogo completo de Técnicas · estados avanzados · combate avanzado (críticos, cobertura, ataques múltiples generales, dificultad, conteo de éxitos, iniciativa compleja).

---

## 4. Reglas congeladas para el playtest (referencia rápida)

- **Combate:** Ataque `XgY` vs Defensa `XgY`; se **suman** los dados guardados; mayor suma gana. Perdedor de la comparación: si es el defensor, recibe 1 herida; si es el atacante (o empate), retrocede 1 hex y queda Stunned.
- **Daño:** perder = 1 herida. Sin segunda tirada.
- **Explosión:** un 10 explota (tira otro D10 y suma; encadena).
- **Distancia/Rango/LoS:** contar hexágonos desde adyacente; Rango se mide como Movimiento; LoS de centro a centro con regla del borde.
- **Foco:** valor fijo por unidad = máximo de tokens; coste escalonado 1/3/5 PO por token; pago mixto de Técnicas (tokens guardados + carta del elemento).
- **Coste de acciones por unidad:** 1 / 3 / 5 / 9 PO.
- **Atacar** cierra la activación de esa unidad en el turno.
- **Ronda:** moneda para el inicial; no se puede pasar; termina cuando ambas manos quedan vacías.
- **Victoria:** todas las unidades eliminadas, o Rey muerto (jaque mate).

---

## 5. Matriz de requerimientos funcionales (Backlog MVP)

**Prioridad (MoSCoW):** M = Must (imprescindible para jugar una partida) · S = Should · C = Could · W = Won't-now (documentado, no se implementa en este ciclo).

**Estado:** ⬜ pendiente · 🟨 en diseño/prueba · ✅ validado en playtest.

### Módulo A — Preparación de partida

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-001 | Cada jugador dispone de un mazo de 15 cartas asociado a su facción. | M | ⬜ | — | Se cuentan 15 cartas por mazo antes de empezar. |
| FR-002 | Cada jugador controla una banda de 4–6 unidades con perfil de arquetipo asignado. | M | ⬜ | FR-020 | Cada miniatura tiene su ficha con Mov/At/Def/Vida/Rango/Foco. |
| FR-003 | El jugador inicial se determina con tirada de moneda. | M | ⬜ | — | Se ejecuta la tirada y se registra quién empieza. |
| FR-004 | Existe robo/mano inicial definido antes del primer turno. | S | ⬜ | FR-001 | Se define tamaño de mano inicial y se reparte (valor a fijar en playtest). |

### Módulo B — Cartas y PO

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-010 | Una carta jugada como Orden genera PO igual a su valor (1–3) del elemento de la carta. | M | ⬜ | — | `🔥3` produce 3 PO de Fuego; la carta se descarta. |
| FR-011 | Los PO se gastan en el turno; el PO no convertido a Foco se pierde al terminar el turno. | M | ⬜ | FR-010 | Al cerrar el turno no queda bolsa de PO acumulada. |
| FR-012 | Las acciones básicas aceptan PO de cualquier elemento. | M | ⬜ | FR-010 | Se paga Mover con PO de cualquier color sin restricción. |
| FR-013 | Una unidad puede recibir PO/energía de varias fuentes en el mismo turno sin superar su Foco. | S | ⬜ | FR-030 | Farmeo propio + aporte de compañero se acumulan hasta el tope de Foco. |
| FR-014 | En el MVP toda carta se juega únicamente como Orden (Equipo/Recurso deshabilitados). | M | ⬜ | — | No existe opción de equipar ni de convertir en recurso. |

### Módulo C — Foco

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-020 | Cada unidad tiene un valor de Foco fijo = máximo de tokens que puede almacenar. | M | ⬜ | — | Una unidad Foco 2 nunca guarda un 3er token. |
| FR-021 | La acción Foco convierte PO en tokens con coste escalonado: 1º=1 PO, 2º=3 PO, 3º=5 PO. | M | ⬜ | FR-020 | Llenar Foco 2 cuesta 4 PO totales, verificado en mesa. |
| FR-022 | Una unidad puede almacenar tokens de elementos distintos simultáneamente. | M | ⬜ | FR-020 | Guarda 🌪️ y 💧 a la vez para una Técnica mixta. |
| FR-023 | Los tokens no se transfieren entre unidades. | S | ⬜ | FR-020 | No hay acción que mueva tokens de una miniatura a otra. |
| FR-024 | Definir persistencia de tokens entre rondas (arranque: persisten). | S | 🟨 | FR-020 | Playtest confirma si persisten o se vacían al fin de ronda. |
| FR-025 | Definir si Concentrarse incrementa el contador de acciones 1/3/5/9 (arranque: no). | C | 🟨 | FR-021, FR-041 | Regla escrita y probada; el coste de token no se duplica con el de acción. |

### Módulo D — Activación y acciones

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-030 | El jugador puede activar una o varias unidades con los PO disponibles, intercalando activaciones. | M | ⬜ | FR-010 | Una carta de 5 PO permite, p. ej., 3+1+1 entre tres unidades. |
| FR-031 | Acción **Mover**: la unidad se desplaza hasta su Movimiento; no atraviesa hex ocupados ni bloqueados. | M | ⬜ | — | Un Mov 3 no llega a un destino cuyo camino está bloqueado. |
| FR-032 | Acción **Atacar**: resuelve melee o a distancia por D10 Roll & Keep. | M | ⬜ | FR-050 | Se ejecuta una tirada de ataque completa. |
| FR-033 | Tras Atacar, la unidad no puede volver a activarse ese turno. | M | ⬜ | FR-032 | No se permite mover→atacar→mover con la misma unidad en el turno. |
| FR-034 | Acción **Interactuar**: interacción genérica con el escenario (placeholder para MVP). | C | ⬜ | — | Existe la acción aunque el escenario base no la exija. |
| FR-035 | Acción **Foco (Concentrarse)**: convierte PO en tokens (ver Módulo C). | M | ⬜ | FR-021 | Se generan tokens según el coste escalonado. |
| FR-036 | Costo progresivo de acciones por unidad: 1/3/5/9 PO. | M | ⬜ | FR-030 | La 2ª acción de una misma unidad cuesta 3 PO. |

### Módulo E — Tablero, distancia y visión

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-040 | El tablero es hexagonal; adyacencia = 1 hex. | M | ⬜ | — | Movimiento y medición usan adyacencia hexagonal. |
| FR-041 | Distancia se cuenta por hexágonos desde adyacente, sin exigir línea recta. | M | ⬜ | FR-040 | Distancia 2 = dos hex, por cualquier trayecto. |
| FR-042 | Rango de ataque se mide igual que el Movimiento (1=adyacente, 2..n=2..n hex). | M | ⬜ | FR-041 | Un Alfil Rango 3 alcanza objetivos a ≤3 hex. |
| FR-043 | LoS: línea centro-a-centro; obstruida si cruza hex bloqueado/ocupado; el borde no obstruye. | M | ⬜ | FR-040 | Un objetivo tras una caja adyacente en el trayecto queda sin LoS. |

### Módulo F — Combate

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-050 | Ataque y Defensa se tiran como `XgY` (pool X, guardar Y). | M | ⬜ | — | Un 2g1 tira 2 D10 y conserva 1. |
| FR-051 | Resolución por suma de dados guardados; mayor suma gana. | M | ⬜ | FR-050 | Se compara la suma del atacante contra la del defensor. |
| FR-052 | Atacante gana → defensor recibe 1 herida. | M | ⬜ | FR-051 | Se registra 1 herida en el defensor. |
| FR-053 | Defensor gana → atacante retrocede 1 hex y queda Stunned. | M | ⬜ | FR-051, FR-070 | El atacante se mueve 1 hex atrás y recibe el token Stunned. |
| FR-054 | Empate → gana la defensa (retroceso + Stunned del atacante). | M | ⬜ | FR-053 | El empate resuelve idéntico a "defensor gana". |
| FR-055 | Daño: 1 combate perdido = 1 herida; sin segunda tirada de daño. | M | ⬜ | FR-052 | No se hace tirada adicional para calcular heridas. |
| FR-056 | Dados explosivos: un 10 tira un D10 extra que se suma; encadena. | M | ⬜ | FR-050 | Un 10 seguido de 10 acumula ambos + el siguiente. |
| FR-057 | Ataque a distancia requiere Rango y LoS válidos. | M | ⬜ | FR-042, FR-043 | Sin LoS no se permite el ataque a distancia. |

### Módulo G — Unidades

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-060 | Existen 6 arquetipos con perfil definido: Peón, Alfil, Torre, Caballo, Campeón, Rey. | M | ⬜ | — | Cada arquetipo tiene ficha con sus 6 atributos. |
| FR-061 | Vida entre 2 y 4; unidad eliminada al alcanzar heridas ≥ Vida. | M | ⬜ | FR-052 | Una unidad Vida 2 muere a la 2ª herida. |
| FR-062 | Keep 2 solo en Campeón (Ataque) y Rey (Defensa); resto Keep 1. | S | ⬜ | FR-060 | Ninguna unidad estándar guarda 2 dados. |
| FR-063 | Cada facción es asimétrica en composición y distribución elemental del mazo. | S | ⬜ | FR-001, FR-060 | Las dos bandas difieren en unidades y/o mezcla de cartas. |

### Módulo H — Técnicas

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-070 | Existe un catálogo mínimo de 4–5 Técnicas con coste elemental. | M | ⬜ | FR-020 | Están definidas Explosión, Doble Tiro, Muro, Reflujo (+ Disipar opcional). |
| FR-071 | Una Técnica consume los tokens requeridos de la reserva de la unidad. | M | ⬜ | FR-070 | Al usar Explosión se descuentan 🔥🔥 de la reserva. |
| FR-072 | Pago mixto: si la Técnica pide más tokens que el Foco de la unidad, se completa con una carta del elemento correcto jugada en el momento. | M | ⬜ | FR-071 | Foco 2 + Técnica de 3 = 2 guardados + 1 por carta. |
| FR-073 | Definir momento de activación y si consume acción propia (arranque: se declara con el Atacar). | S | 🟨 | FR-070 | Regla escrita y probada en al menos una partida. |

### Módulo I — Estados

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-080 | Existe el estado **Stunned** con efecto provisional: −1 dado en su próxima tirada; luego se remueve. | M | 🟨 | — | La unidad Stunned tira un dado menos la próxima vez y pierde el token. |
| FR-081 | El resto de estados avanzados NO se implementa en el MVP. | W | ⬜ | — | Solo Stunned está en juego. |

### Módulo J — Ronda y victoria

| ID | Requerimiento (testeable) | Prioridad | Estado | Depende de | Criterio de aceptación |
|---|---|---|---|---|---|
| FR-090 | El turno obliga a jugar una carta; no se puede pasar. | M | ⬜ | FR-010 | No existe acción "pasar" disponible. |
| FR-091 | Los jugadores alternan turnos; el que se queda sin cartas antes cede el turno y el otro continúa solo hasta agotar su mano. | M | ⬜ | FR-090 | Se juega correctamente el tramo de turnos en solitario. |
| FR-092 | La ronda termina cuando ambos jugadores tienen la mano vacía. | M | ⬜ | FR-091 | El fin de ronda se dispara solo con ambas manos vacías. |
| FR-093 | Pueden existir activaciones gratuitas (dados explotados, cartas, habilidades). | C | ⬜ | FR-056 | Al menos un caso de activación gratuita se resuelve sin coste de PO. |
| FR-094 | Derrota si todas las unidades del jugador son eliminadas. | M | ⬜ | FR-061 | Sin unidades en mesa = derrota. |
| FR-095 | Derrota inmediata si muere el Rey (jaque mate). | M | ⬜ | FR-061 | La muerte del Rey termina la partida al instante. |

---

## 6. Objetivo del primer playtest (5 preguntas)

1. **¿Las cartas generan decisiones interesantes?** ¿Juego la carta por PO o la reservo?
2. **¿Los PO funcionan como economía táctica?** ¿Alcanzan para cosas interesantes sin poder hacer todo?
3. **¿Foco genera planificación?** ¿Vale sacrificar una acción inmediata para preparar una Técnica? *(Depende de que las Técnicas estén dentro del MVP — por eso se incluyeron.)*
4. **¿El Roll & Keep funciona?** ¿Las tiradas D10 dan tensión sin ser arbitrarias?
5. **¿Las unidades se sienten diferentes?** ¿Un perfil de Fuego se juega distinto de uno de Agua/Aire/Tierra/Vacío?

## 7. Criterio de éxito del MVP

Una partida permite experimentar claramente el ciclo:

`ROBO CARTA → DECIDO FUNCIÓN → GENERO PO → ACTIVO UNIDAD → EJECUTO ACCIÓN → ACUMULO FOCO → PREPARO TÉCNICA → COMBATO → CAMBIA EL ESTADO DEL TABLERO.`

Y, fundamentalmente: **la mejor jugada no es obvia solo por el valor numérico de la carta.**

---

## 8. Watch points de balance a vigilar en el playtest

- **Keep 2 domina** — confirmar que Campeón/Rey no vuelven trivial el combate.
- **Curva 1/3/5/9 inerte** — con 1 carta/turno rara vez se pasa de la 1ª–2ª acción; la diferenciación real viene del pool de dados.
- **Foco escalonado vs. mazo chico** — con cartas de 3 PO, cargar una Técnica de 2 tokens (4 PO) exige normalmente **dos turnos**: verificar que ese ritmo se sienta bien y no frustrante.
- **Asimetría de tempo** — la ronda que termina con *ambas* manos vacías premia retener cartas; vigilar el *hoarding*.
- **Muerte del Rey anticlimática** — con combate *swingy* + explosiones, revisar que la Vida/Defensa del Rey lo protejan lo suficiente.
- **Efecto de Stunned** — medir si −1 dado es castigo suficiente o excesivo.
