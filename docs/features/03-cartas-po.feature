# language: es
@epica-3 @cartas @po
Característica: US-020 — Jugar una carta como Orden genera PO

  Como jugador
  quiero convertir una carta en Puntos de Orden de su elemento
  para tener con qué activar unidades este turno.

  Cubre FR-010, FR-014, FR-090.

  Contexto:
    Dado que es mi turno
    Y que tengo en la mano la carta "🔥3"

  @must @FR-010
  Escenario: La carta genera PO de su elemento y se descarta
    Cuando juego "🔥3" como Orden
    Entonces dispongo de 3 PO de Fuego
    Y la carta ya no está en mi mano
    Y la carta está en mi pila de descarte

  @must @FR-010
  Esquema del escenario: El valor de la carta define la cantidad de PO
    Dado que tengo en la mano la carta "<carta>"
    Cuando la juego como Orden
    Entonces dispongo de <po> PO del elemento <elemento>

    Ejemplos:
      | carta | po | elemento |
      | 🔥1   | 1  | Fuego    |
      | 💧2   | 2  | Agua     |
      | 🌪️3   | 3  | Aire     |
      | 🌍1   | 1  | Tierra   |
      | ◼️2   | 2  | Vacío    |

  @must @FR-090
  Escenario: Jugar carta es obligatorio
    Dado que tengo al menos una carta en la mano
    Cuando busco una acción para pasar el turno
    Entonces no existe ninguna opción de pasar
    Y el turno solo avanza después de haber jugado una carta

  @must @FR-090
  Escenario: Una carta por turno
    Dado que ya jugué una carta este turno
    Cuando intento jugar una segunda carta
    Entonces la acción es rechazada
    Y se indica que ya se jugó la carta del turno

  @should
  Escenario: Los PO disponibles se ven en pantalla
    Cuando juego "🔥3" como Orden
    Entonces el panel de PO muestra 3 fichas de Fuego
    Y las fichas se descuentan visualmente a medida que las gasto


@epica-3 @cartas @po
Característica: US-021 — Las acciones básicas aceptan PO de cualquier elemento

  Como jugador
  quiero pagar acciones básicas sin importar el color del PO
  para tener fluidez táctica y reservar la identidad elemental para las Técnicas.

  Cubre FR-012.

  @must @FR-012
  Escenario: Pago de una acción básica con cualquier elemento
    Dado que tengo 3 PO de Fuego
    Cuando ordeno a una unidad la acción Mover, que cuesta 1 PO
    Entonces la acción se ejecuta
    Y me quedan 2 PO de Fuego

  @must @FR-012
  Escenario: Pago mixto de una acción básica
    Dado que tengo 1 PO de Agua y 2 PO de Tierra
    Cuando ejecuto una acción que cuesta 3 PO
    Entonces la acción se ejecuta
    Y me quedo sin PO
    Y el log detalla qué PO se consumieron

  @must @FR-012
  Escenario: PO insuficientes
    Dado que tengo 1 PO
    Cuando intento ejecutar una acción que cuesta 3 PO
    Entonces la acción es rechazada
    Y no se descuenta ningún PO


@epica-3 @cartas @po
Característica: US-022 — Los PO no gastados se pierden al terminar el turno

  Como diseñador
  quiero que no exista bolsa flotante de PO
  para que el único depósito persistente sea el Foco de cada unidad.

  Cubre FR-011.

  @must @FR-011
  Escenario: El PO sobrante se pierde
    Dado que jugué "🌪️3" y gasté 1 PO en Mover
    Cuando termino mi turno
    Entonces mi reserva de PO queda vacía
    Y el log registra 2 PO perdidos

  @must @FR-011
  Escenario: El Foco no se pierde
    Dado que convertí 1 PO en un token de Foco sobre una unidad
    Cuando termino mi turno
    Entonces la reserva de PO queda vacía
    Pero la unidad conserva su token de Foco

  @should
  Escenario: Aviso antes de perder PO
    Dado que me quedan PO sin gastar
    Cuando intento terminar el turno
    Entonces se me advierte cuántos PO voy a perder
    Y debo confirmar para continuar
