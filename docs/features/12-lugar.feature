# language: es
@epica-3 @tablero @playtest
Característica: US-162 — Capturar un Lugar otorga VP y agota la casilla

  Como jugador
  quiero capturar los lugares del escenario con la acción Interactuar
  para que el mapa tenga puntos disputados más allá del combate.

  Cubre FR-034, FR-040.

  Regla nueva (decisión D-26, playtest 07/08/2026, conmutable en
  estado.reglas.lugarHabilitado). Modelo:
  - Un Lugar es una casilla del escenario marcada como estratégica.
  - Se captura con la acción Interactuar desde un hex sobre o adyacente al lugar.
  - Coste FIJO de 2 PO (rompe la curva 1/2/3/5 a propósito): +1 VP al marcador.
  - El VP es SOLO visual: la victoria sigue por eliminación total o muerte del Rey.
  - Al capturarse, la casilla pasa a `bloqueados`: no se puede volver a capturar
    e impide movimiento y línea de visión.
  - La captura consume una acción (incrementa el contador 1/2/3/5).

  Contexto:
    Dado que el jugador A es el turno activo
    Y que la mecánica Lugar está habilitada
    Y que existe un Lugar en el hex (0,0)

  @must @FR-034
  Esquema del escenario: Captura desde un hex sobre o adyacente
    Dado que una unidad de A con 3 PO está a distancia <distancia> del Lugar
    Cuando la unidad captura el Lugar (0,0)
    Entonces se gastan exactamente 2 PO (quedan 1)
    Y el marcador de A suma 1 VP
    Y la casilla (0,0) queda bloqueada
    Y la unidad consume una acción

    Ejemplos:
      | distancia |
      | 0         |
      | 1         |

  @must @FR-034
  Escenario: Capturar desde lejos se rechaza sin efectos parciales
    Dado que una unidad de A con 3 PO está a distancia 2 del Lugar
    Cuando la unidad intenta capturar el Lugar (0,0)
    Entonces la acción es rechazada
    Y no se gasta ningún PO
    Y el contador de acciones de la unidad no cambia
    Y la casilla (0,0) no queda bloqueada

  @must @FR-034
  Escenario: El hex indicado debe contener un Lugar
    Dado que una unidad de A con 3 PO está adyacente al hex (2,0)
    Cuando la unidad intenta capturar el hex (2,0)
    Entonces la acción es rechazada
    Y no se gasta ningún PO
    Y no se suman VP

  @must @FR-034
  Escenario: Un Lugar ya capturado no se vuelve a capturar
    Dado que una unidad de A con 3 PO está adyacente al Lugar (0,0)
    Y que el Lugar (0,0) ya está en bloqueados
    Cuando la unidad intenta capturar el Lugar (0,0)
    Entonces la acción es rechazada
    Y no se gasta ningún PO
    Y no se suman VP

  @must @FR-034
  Escenario: Sin PO suficientes no se captura
    Dado que una unidad de A con 1 PO está adyacente al Lugar
    Cuando la unidad intenta capturar el Lugar (0,0)
    Entonces la acción es rechazada
    Y no se gasta ningún PO
    Y la casilla (0,0) no queda bloqueada

  @must @FR-034
  Escenario: Flag apagado conserva el MVP actual
    Dado que la mecánica Lugar está deshabilitada
    Y que una unidad de A con 3 PO está adyacente al Lugar
    Cuando la unidad intenta capturar el Lugar (0,0)
    Entonces la acción es rechazada
    Y no se gasta ningún PO
    Y no se suman VP
