# language: es
@epica-1 @tablero
Característica: US-010 — Tablero hexagonal y coordenadas

  Como jugador
  quiero un tablero de hexágonos con adyacencia clara
  para poder medir movimiento y alcance sin discusiones.

  Cubre FR-040.

  Contexto:
    Dado un tablero hexagonal con orientación "punta arriba"
    Y coordenadas axiales (q, r) donde cada hexágono tiene exactamente 6 vecinos

  @must @FR-040
  Escenario: El tablero se dibuja y responde al click
    Dado un escenario base rectangular de 15 columnas por 10 filas
    Cuando abro la partida
    Entonces veo 150 hexágonos dibujados en SVG
    Y al hacer click sobre uno se muestran sus coordenadas (q, r)

  @must @FR-040
  Escenario: Adyacencia es distancia 1
    Dado el hexágono en (0, 0)
    Cuando consulto sus vecinos
    Entonces obtengo 6 hexágonos
    Y todos están a distancia 1

  @must @FR-040
  Escenario: Los hexágonos bloqueados se distinguen visualmente
    Dado un escenario con los hexágonos (1,0) y (1,1) marcados como bloqueados
    Cuando abro la partida
    Entonces esos dos hexágonos se dibujan con el estilo de terreno bloqueado
    Y no son seleccionables como destino de movimiento


@epica-1 @tablero
Característica: US-011 — Medición de distancia

  Como jugador
  quiero contar hexágonos desde el adyacente
  para saber si un objetivo está a mi alcance.

  Cubre FR-041.

  @must @FR-041
  Esquema del escenario: Distancia entre dos hexágonos
    Dado un hexágono origen en (<q1>, <r1>)
    Cuando mido la distancia hasta (<q2>, <r2>)
    Entonces la distancia es <distancia>

    Ejemplos:
      | q1 | r1 | q2 | r2 | distancia |
      | 0  | 0  | 0  | 0  | 0         |
      | 0  | 0  | 1  | 0  | 1         |
      | 0  | 0  | 2  | 0  | 2         |
      | 0  | 0  | 0  | 2  | 2         |
      | 0  | 0  | 2  | -1 | 2         |
      | 0  | 0  | -2 | 3  | 3         |

  @must @FR-041
  Escenario: La distancia no exige línea recta
    Dado un objetivo a distancia 2 en línea recta
    Y un camino alternativo en diagonal que también recorre 2 hexágonos
    Cuando mido la distancia por ambos trayectos
    Entonces el resultado es 2 en los dos casos

  @must @FR-041
  Escenario: Los hexágonos bloqueados no alteran la medición
    Dado un hexágono bloqueado entre origen y objetivo
    Cuando mido la distancia
    Entonces la distancia sigue siendo la misma que sin el bloqueo
    Pero la línea de visión se evalúa por separado


@epica-1 @tablero
Característica: US-012 — Movimiento sobre el tablero

  Como jugador
  quiero mover una unidad hasta su valor de Movimiento sin atravesar obstáculos
  para maniobrar en el tablero.

  Cubre FR-031 (parte geométrica; el coste en PO se agrega en US-032).

  Contexto:
    Dado una unidad "Peón" con Movimiento 3 en el hexágono (0, 0)

  @must @FR-031
  Escenario: Se muestran los destinos alcanzables
    Cuando selecciono la unidad
    Entonces se resaltan todos los hexágonos alcanzables en 3 pasos o menos
    Y ningún hexágono resaltado está ocupado o bloqueado

  @must @FR-031
  Escenario: No se atraviesan hexágonos ocupados
    Dado que el único camino hacia (3, 0) pasa por (1, 0) y (2, 0)
    Y que (2, 0) está ocupado por otra unidad
    Cuando intento mover la unidad a (3, 0)
    Entonces el movimiento es rechazado
    Y la unidad permanece en (0, 0)

  @must @FR-031
  Escenario: No se atraviesan hexágonos bloqueados
    Dado que (1, 0) está marcado como bloqueado
    Cuando intento mover la unidad atravesando (1, 0)
    Entonces el movimiento es rechazado

  @must @FR-031
  Escenario: No se supera el valor de Movimiento
    Cuando intento mover la unidad a un hexágono a distancia 4 por camino libre
    Entonces el movimiento es rechazado por exceder el Movimiento de la unidad

  @must @FR-031
  Escenario: Movimiento válido con rodeo
    Dado que (1, 0) está bloqueado
    Y que existe un camino libre de 3 pasos hasta (2, 0)
    Cuando muevo la unidad a (2, 0)
    Entonces la unidad queda en (2, 0)
    Y el hexágono (0, 0) queda libre


@epica-1 @tablero
Característica: US-013 — Línea de visión

  Como jugador
  quiero saber si veo a mi objetivo
  para poder declarar ataques a distancia legales.

  Cubre FR-043. Regla del borde: la línea se traza de centro a centro; si solo
  roza el borde de un hexágono bloqueado u ocupado, NO obstruye.
  Implementación sugerida: trazar dos líneas con desplazamiento mínimo opuesto
  (+ε y −ε); hay obstrucción solo si AMBAS cruzan un hexágono obstructor.

  @must @FR-043
  Escenario: Línea despejada
    Dado un atacante en (0, 0) y un objetivo en (3, 0)
    Y ningún hexágono obstructor entre ambos
    Cuando evalúo la línea de visión
    Entonces la línea de visión es válida

  @must @FR-043
  Escenario: Un hexágono bloqueado en el trayecto obstruye
    Dado un atacante en (0, 0) y un objetivo en (3, 0)
    Y el hexágono (2, 0) marcado como bloqueado
    Cuando evalúo la línea de visión
    Entonces la línea de visión está obstruida

  @must @FR-043
  Escenario: Una unidad interpuesta obstruye, sea amiga o enemiga
    Dado un atacante en (0, 0) y un objetivo en (3, 0)
    Y una unidad amiga en (1, 0)
    Cuando evalúo la línea de visión
    Entonces la línea de visión está obstruida

  @must @FR-043
  Escenario: Rozar el borde no obstruye
    Dado un atacante y un objetivo cuya línea centro a centro pasa exactamente
      por el borde compartido entre un hexágono bloqueado y uno libre
    Cuando evalúo la línea de visión
    Entonces la línea de visión es válida

  @should @FR-043
  Escenario: La obstrucción se comunica en pantalla
    Dado un objetivo dentro del rango pero sin línea de visión
    Cuando lo señalo como objetivo
    Entonces se muestra el motivo "sin línea de visión"
    Y el botón de atacar queda deshabilitado
