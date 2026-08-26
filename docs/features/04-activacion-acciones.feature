# language: es
@epica-4 @activacion
Característica: US-030 — Activaciones intercaladas

  Como jugador
  quiero repartir los PO de una carta entre varias unidades
  para decidir entre profundidad en una unidad o amplitud en la banda.

  Cubre FR-030.

  Contexto:
    Dado que controlo las unidades "Peón-1", "Alfil-1" y "Caballo-1"

  @must @FR-030
  Escenario: Repartir 3 PO entre tres unidades
    Dado que dispongo de 3 PO
    Cuando activo "Peón-1" y ejecuto Mover por 1 PO
    Y activo "Alfil-1" y ejecuto Mover por 1 PO
    Y activo "Caballo-1" y ejecuto Mover por 1 PO
    Entonces las tres unidades se movieron
    Y me quedo sin PO

  @must @FR-030
  Escenario: Volver a una unidad ya activada
    Dado que dispongo de 5 PO
    Y que "Peón-1" ya ejecutó una acción este turno
    Cuando activo "Alfil-1" y ejecuto una acción por 1 PO
    Y vuelvo a "Peón-1" para ejecutar una segunda acción
    Entonces la segunda acción de "Peón-1" cuesta 3 PO
    Y me quedo con 0 PO

  @must @FR-030
  Escenario: No se pueden activar unidades del oponente
    Cuando intento activar una unidad del jugador rival
    Entonces la acción es rechazada


@epica-4 @activacion
Característica: US-031 — Coste progresivo de acciones por unidad

  Como diseñador
  quiero que cada acción adicional de la misma unidad sea más cara
  para que concentrar PO en una sola miniatura tenga costo de oportunidad.

  Cubre FR-036 y la decisión D-05 (el contador se reinicia por turno).

  @must @FR-036
  Esquema del escenario: Escala 1/3/5/9
    Dado que "Peón-1" ya ejecutó <previas> acciones este turno
    Cuando consulto el coste de su próxima acción
    Entonces el coste es <coste> PO

    Ejemplos:
      | previas | coste |
      | 0       | 1     |
      | 1       | 3     |
      | 2       | 5     |
      | 3       | 9     |

  @must @FR-036
  Escenario: El contador es individual por unidad
    Dado que "Peón-1" ya ejecutó 2 acciones este turno
    Cuando consulto el coste de la primera acción de "Alfil-1"
    Entonces el coste es 1 PO

  @must @FR-036
  Escenario: El contador se reinicia al terminar el turno
    Dado que "Peón-1" ejecutó 2 acciones en mi turno anterior
    Cuando comienza mi nuevo turno
    Entonces la próxima acción de "Peón-1" vuelve a costar 1 PO

  @should
  Escenario: El coste se muestra antes de confirmar
    Cuando selecciono una unidad
    Entonces cada acción disponible muestra su coste actual en PO
    Y las acciones que no puedo pagar aparecen deshabilitadas


@epica-4 @activacion
Característica: US-032 — Acción Mover

  Como jugador
  quiero pagar y ejecutar un movimiento
  para reposicionar mis unidades.

  Cubre FR-031 junto con US-012 (geometría) y FR-036 (coste).

  @must @FR-031
  Escenario: Mover paga el coste y desplaza la unidad
    Dado que "Caballo-1" con Movimiento 5 está en (0, 0)
    Y que dispongo de 1 PO
    Cuando lo muevo a (3, 0) por camino libre
    Entonces la unidad queda en (3, 0)
    Y se descuenta 1 PO
    Y su contador de acciones del turno pasa a 1

  @must @FR-031
  Escenario: Un movimiento rechazado no consume PO ni contador
    Dado que dispongo de 1 PO
    Cuando intento un movimiento ilegal
    Entonces se conserva el PO
    Y el contador de acciones no se incrementa


@epica-4 @activacion
Característica: US-033 — Atacar cierra la activación de la unidad

  Como diseñador
  quiero que atacar termine la participación de esa unidad en el turno
  para evitar la secuencia mover-atacar-mover.

  Cubre FR-033.

  @must @FR-033
  Escenario: Después de atacar la unidad no vuelve a activarse
    Dado que "Peón-1" ejecutó la acción Atacar este turno
    Y que aún dispongo de PO suficientes
    Cuando intento activar "Peón-1" nuevamente
    Entonces la activación es rechazada
    Y se indica que la unidad ya atacó este turno

  @must @FR-033
  Escenario: Se puede mover y después atacar
    Dado que dispongo de 4 PO
    Cuando muevo "Peón-1" por 1 PO
    Y luego ataco con "Peón-1" por 3 PO
    Entonces ambas acciones se ejecutan
    Y la activación de "Peón-1" queda cerrada

  @must @FR-033
  Escenario: El cierre se levanta al siguiente turno
    Dado que "Peón-1" atacó en mi turno anterior
    Cuando comienza mi nuevo turno
    Entonces "Peón-1" puede activarse normalmente

  @must @FR-033
  Escenario: Defender no cierra la activación
    Dado que "Torre-1" fue atacada en el turno del rival
    Cuando comienza mi turno
    Entonces "Torre-1" puede activarse normalmente


@epica-4 @activacion
Característica: US-034 — Acción Interactuar

  Como diseñador
  quiero dejar la acción Interactuar declarada aunque el escenario base no la use
  para no rediseñar el menú de acciones cuando lleguen los escenarios.

  Cubre FR-034.

  @could @FR-034
  Escenario: La acción existe en el menú
    Cuando selecciono una unidad
    Entonces la acción Interactuar aparece entre las cuatro acciones básicas

  @could @FR-034
  Escenario: Sin objetivo interactuable
    Dado que la unidad no está adyacente a ningún elemento de escenario
    Cuando elijo Interactuar
    Entonces la acción aparece deshabilitada con el motivo "nada con qué interactuar"
    Y no se consume PO
