# language: es
@epica-6 @estados
Característica: US-060 — Estado Stunned

  Como diseñador
  quiero un único estado en el MVP con efecto medible
  para poder evaluar si el castigo por perder un ataque es suficiente o excesivo.

  Cubre FR-080, FR-081 y la decisión D-10 (mínimo 1 dado).
  El efecto es 🟡 provisional: debe vivir en "data/rules.js" para poder cambiarlo
  sin tocar el motor.

  Contexto:
    Dado una unidad "Alfil-1" con Ataque 2g1 y Defensa 1g1

  @must @FR-080
  Escenario: Stunned resta un dado a la próxima tirada de Ataque
    Dado que "Alfil-1" tiene el estado Stunned
    Cuando "Alfil-1" ataca
    Entonces tira 1 dado en lugar de 2
    Y conserva 1 dado

  @must @FR-080
  Escenario: Stunned resta un dado a la próxima tirada de Defensa
    Dado que "Alfil-1" tiene el estado Stunned
    Cuando "Alfil-1" es atacada
    Entonces su pool de Defensa se reduce en 1 dado

  @must @FR-080
  Escenario: El estado se consume con la primera tirada, sea de ataque o de defensa
    Dado que "Alfil-1" tiene el estado Stunned
    Cuando "Alfil-1" es atacada y tira su defensa
    Entonces pierde el estado Stunned
    Y su siguiente tirada usa su pool completo

  @must @FR-080
  Escenario: El pool nunca baja de un dado
    Dado una unidad con Ataque 1g1 y el estado Stunned
    Cuando ataca
    Entonces tira 1 dado
    Y pierde el estado Stunned

  @must @FR-080
  Escenario: Stunned no se acumula
    Dado que "Alfil-1" ya tiene el estado Stunned
    Cuando vuelve a perder un intercambio como atacante
    Entonces sigue teniendo un único estado Stunned

  @must @FR-080
  Escenario: Stunned no impide activarse
    Dado que "Alfil-1" tiene el estado Stunned
    Cuando comienza mi turno
    Entonces puedo activar "Alfil-1" y ejecutar cualquier acción

  @should @FR-080
  Escenario: El estado es visible en el tablero
    Dado que "Alfil-1" tiene el estado Stunned
    Cuando observo el tablero
    Entonces la miniatura muestra un marcador de Stunned
    Y su ficha indica que su próxima tirada pierde un dado

  @wont @FR-081
  Escenario: No hay otros estados en el MVP
    Dado el catálogo de estados implementados
    Cuando lo consulto
    Entonces solo contiene Stunned
