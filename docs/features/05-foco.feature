# language: es
@epica-7 @foco
Característica: US-040 — Reserva de Foco con tope fijo

  Como jugador
  quiero que cada unidad almacene un máximo fijo de tokens elementales
  para que la capacidad de preparar Técnicas sea un atributo del perfil.

  Cubre FR-020.

  @must @FR-020
  Escenario: El Foco es un valor fijo del arquetipo
    Dado una unidad "Alfil-1" con Foco 2
    Cuando consulto su ficha
    Entonces su capacidad máxima de tokens es 2
    Y esa capacidad no depende de ninguna Técnica

  @must @FR-020
  Escenario: No se supera la capacidad
    Dado una unidad con Foco 2 que ya tiene 2 tokens
    Cuando intento generarle un tercer token
    Entonces la acción es rechazada
    Y no se consume PO

  @must @FR-020
  Escenario: La reserva se muestra en el tablero
    Dado una unidad con 1 token de Fuego y capacidad 2
    Cuando observo su miniatura
    Entonces veo 1 casillero de Foco lleno con el símbolo de Fuego y 1 vacío


@epica-7 @foco
Característica: US-041 — Acción Concentrarse con coste escalonado

  Como jugador
  quiero convertir PO en tokens pagando cada vez más
  para que preparar una Técnica sea una inversión real.

  Cubre FR-021, FR-035, FR-025 y las decisiones D-02 y D-04.

  Contexto:
    Dado una unidad "Campeón-1" con Foco 3 y sin tokens

  @must @FR-021
  Esquema del escenario: Coste del siguiente token según los tokens ya guardados
    Dado que la unidad tiene <guardados> tokens en reserva
    Cuando consulto el coste del siguiente token
    Entonces el coste es <coste> PO

    Ejemplos:
      | guardados | coste |
      | 0         | 1     |
      | 1         | 3     |
      | 2         | 5     |

  @must @FR-021
  Escenario: Llenar un Foco 2 cuesta 4 PO en total
    Dado una unidad con Foco 2 y sin tokens
    Y que dispongo de 4 PO de Agua
    Cuando genero dos tokens de Agua
    Entonces la unidad tiene 2 tokens de Agua
    Y me quedo sin PO

  @must @FR-035
  Escenario: El token toma el elemento del PO gastado
    Dado que dispongo de 1 PO de Tierra
    Cuando concentro ese PO en la unidad
    Entonces la unidad guarda 1 token de Tierra

  @must @FR-025
  Escenario: Concentrarse no incrementa el contador de acciones
    Dado que la unidad no ejecutó acciones este turno
    Cuando ejecuta Concentrarse
    Entonces el coste pagado es solo el del token
    Y el contador de acciones 1/3/5/9 de la unidad sigue en 0

  @must @FR-021
  Escenario: PO insuficientes para el siguiente token
    Dado que la unidad ya tiene 1 token y dispongo de 2 PO
    Cuando intento generar un segundo token que cuesta 3 PO
    Entonces la acción es rechazada
    Y conservo mis 2 PO


@epica-7 @foco
Característica: US-042 — Tokens de elementos distintos

  Como jugador
  quiero mezclar elementos en la misma reserva
  para poder pagar Técnicas mixtas.

  Cubre FR-022.

  @must @FR-022
  Escenario: Reserva mixta
    Dado una unidad con Foco 2 y sin tokens
    Cuando genero 1 token de Aire y luego 1 token de Agua
    Entonces la unidad tiene 1 token de Aire y 1 token de Agua
    Y ambos son visibles por separado en su ficha

  @must @FR-022
  Escenario: El tope aplica al total, no por elemento
    Dado una unidad con Foco 2 que tiene 1 token de Aire y 1 de Agua
    Cuando intento generar un token de Fuego
    Entonces la acción es rechazada por capacidad completa


@epica-7 @foco
Característica: US-043 — Los tokens no se transfieren

  Como diseñador
  quiero que la energía quede atada a la miniatura que la generó
  para que la planificación sea posicional.

  Cubre FR-023.

  @should @FR-023
  Escenario: No existe acción de transferencia
    Dado dos unidades propias adyacentes, una con tokens y otra sin ellos
    Cuando abro el menú de acciones de cualquiera
    Entonces no aparece ninguna opción de transferir tokens

  @should @FR-023
  Escenario: Los tokens se pierden con la unidad
    Dado una unidad con 2 tokens que es eliminada
    Cuando reviso el estado de la partida
    Entonces esos tokens desaparecen con ella
    Y ninguna otra unidad los recibe


@epica-7 @foco
Característica: US-044 — Persistencia de tokens entre rondas

  Como diseñador
  quiero poder conmutar si los tokens sobreviven al fin de ronda
  para medir en playtest cuál de las dos versiones se siente mejor.

  Cubre FR-024 y la decisión D-01 (arranque: persisten).

  @should @FR-024
  Escenario: Con la regla en "persisten"
    Dado que la regla de persistencia de Foco está activada
    Y una unidad con 2 tokens al final de la ronda
    Cuando comienza la ronda siguiente
    Entonces la unidad conserva sus 2 tokens

  @should @FR-024
  Escenario: Con la regla en "se vacían"
    Dado que la regla de persistencia de Foco está desactivada
    Y una unidad con 2 tokens al final de la ronda
    Cuando comienza la ronda siguiente
    Entonces la unidad no tiene tokens
    Y el log registra los tokens perdidos

  @should @FR-024
  Escenario: Los tokens nunca se pierden por fin de turno
    Dado una unidad con 1 token
    Cuando termina mi turno dentro de la misma ronda
    Entonces la unidad conserva su token con cualquiera de las dos reglas


@epica-7 @foco
Característica: US-045 — Aportes de varias fuentes en el mismo turno

  Como jugador
  quiero que una unidad reciba energía de más de una fuente
  para habilitar sinergias entre miniaturas sin romper el tope de Foco.

  Cubre FR-013.

  @should @FR-013
  Escenario: Acumulación desde dos fuentes
    Dado una unidad con Foco 3 y 0 tokens
    Cuando recibe 1 token por su propia acción de Concentrarse
    Y recibe 1 token por un aporte externo en el mismo turno
    Entonces la unidad tiene 2 tokens

  @should @FR-013
  Escenario: El tope se respeta con aportes externos
    Dado una unidad con Foco 2 y 2 tokens
    Cuando llega un aporte externo de 1 token
    Entonces el aporte se descarta
    Y la unidad sigue con 2 tokens
