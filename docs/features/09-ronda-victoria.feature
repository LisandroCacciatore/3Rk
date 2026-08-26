# language: es
@epica-9 @ronda
Característica: US-080 — Alternancia de turnos sin posibilidad de pasar

  Como jugador
  quiero que cada turno exija jugar una carta
  para que la partida siempre avance.

  Cubre FR-090, FR-091.

  @must @FR-090
  Escenario: No existe la opción de pasar
    Dado que es mi turno y tengo cartas en la mano
    Cuando reviso las acciones de turno disponibles
    Entonces no hay ninguna opción de pasar el turno sin jugar carta

  @must @FR-091
  Escenario: El turno alterna entre jugadores
    Dado que es el turno del jugador A
    Cuando el jugador A termina su turno
    Entonces el turno pasa al jugador B

  @must @FR-090
  Escenario: No se puede terminar el turno sin jugar carta
    Dado que es mi turno y no jugué ninguna carta
    Cuando intento terminar el turno
    Entonces la acción es rechazada
    Y se indica que debo jugar una carta


@epica-9 @ronda
Característica: US-081 — Turnos en solitario y fin de ronda

  Como jugador
  quiero seguir jugando si el rival se quedó sin cartas
  para que retener cartas sea una decisión de tempo.

  Cubre FR-091, FR-092.

  @must @FR-091
  Escenario: El jugador sin cartas cede el turno
    Dado que el jugador B tiene la mano vacía
    Y que el jugador A todavía tiene 2 cartas
    Cuando termina el turno del jugador A
    Entonces el turno vuelve al jugador A
    Y el log registra que B no puede jugar

  @must @FR-092
  Escenario: La ronda termina solo con ambas manos vacías
    Dado que el jugador B tiene la mano vacía
    Y que el jugador A tiene 1 carta
    Cuando el jugador A juega su última carta y termina el turno
    Entonces la ronda finaliza

  @must @FR-092
  Escenario: La ronda no termina con una sola mano vacía
    Dado que el jugador B tiene la mano vacía
    Y que el jugador A tiene 3 cartas
    Cuando termina el turno del jugador A
    Entonces la ronda continúa

  @should
  Escenario: El tempo es visible
    Cuando observo el encabezado
    Entonces veo la ronda actual, de quién es el turno y cuántas cartas tiene cada jugador


@epica-9 @ronda
Característica: US-082 — Comienzo de una nueva ronda

  Como jugador
  quiero recomponer mi mano al empezar la ronda
  para poder jugar varias rondas seguidas.

  Cubre FR-092 y la decisión D-09 (rebarajar descarte y robar mano nueva).

  @must @FR-092
  Escenario: Se rebaraja y se reparte
    Dado que terminó la ronda 1
    Cuando comienza la ronda 2
    Entonces el descarte de cada jugador se rebaraja dentro de su mazo
    Y cada jugador roba su mano inicial
    Y el contador de ronda pasa a 2

  @must @FR-092
  Escenario: El estado del tablero persiste entre rondas
    Cuando comienza una nueva ronda
    Entonces las posiciones, heridas y estados de las unidades se mantienen
    Y las reservas de PO están vacías

  @should @FR-092
  Escenario: El jugador inicial de la nueva ronda
    Cuando comienza una nueva ronda
    Entonces el primer turno lo toma el jugador que definió la moneda al inicio de la partida
    Y esta regla queda marcada como conmutable para el playtest


@epica-9 @ronda
Característica: US-083 — Derrota por eliminación total

  Como jugador
  quiero ganar eliminando toda la banda rival
  para tener una condición de victoria clara.

  Cubre FR-094.

  @must @FR-094
  Escenario: Sin unidades en mesa se pierde
    Dado que el jugador B tiene una sola unidad con 1 herida y Vida 2
    Cuando esa unidad recibe una herida más
    Entonces el jugador B pierde
    Y se muestra la pantalla de fin de partida indicando al ganador

  @must @FR-094
  Escenario: La partida se detiene al terminar
    Dado que la partida terminó
    Cuando intento jugar una carta o activar una unidad
    Entonces la acción es rechazada


@epica-9 @ronda
Característica: US-084 — Derrota inmediata por muerte del Rey

  Como jugador
  quiero que la caída del Rey cierre la partida al instante
  para que proteger al Rey sea una presión constante.

  Cubre FR-095.

  @must @FR-095
  Escenario: La muerte del Rey termina la partida
    Dado que el Rey del jugador B tiene Vida 4 y 3 heridas
    Y que el jugador B conserva otras 4 unidades en el tablero
    Cuando el Rey recibe una herida más
    Entonces la partida termina inmediatamente
    Y gana el jugador A
    Y las unidades restantes de B son irrelevantes para el resultado

  @must @FR-095
  Escenario: La verificación ocurre apenas se aplica la herida
    Cuando muere el Rey
    Entonces no se resuelve ninguna acción pendiente posterior
    Y el log marca el fin de partida por muerte del Rey


@epica-9 @ronda
Característica: US-085 — Activaciones gratuitas

  Como diseñador
  quiero un canal para activaciones sin coste de PO
  para poder premiar explosiones, cartas o habilidades más adelante.

  Cubre FR-093. Prioridad Could.

  @could @FR-093
  Escenario: Una activación gratuita no consume PO
    Dado un efecto que otorga una activación gratuita a una unidad
    Cuando la unidad ejecuta la acción concedida
    Entonces no se descuenta PO

  @could @FR-093
  Escenario: La activación gratuita no altera el contador de coste
    Cuando una unidad usa una activación gratuita
    Entonces su contador de acciones 1/3/5/9 no se incrementa
    Y el log identifica la acción como gratuita

  # Aprobado 04/08/2026 (D-19): el ataque gratuito no cuenta en el contador 1/3/5/9, pero cierra la activación.
  @could @FR-093
  Escenario: Un ataque gratuito cierra igual la activación
    Dado una activación gratuita para atacar a una unidad
    Cuando ataca usando esa activación
    Entonces no se descuenta PO
    Y el contador 1/3/5/9 de la unidad no se incrementa
    Y la activación de la unidad queda cerrada al terminar la acción
