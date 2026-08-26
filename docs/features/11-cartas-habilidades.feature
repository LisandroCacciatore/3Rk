# language: es
@epica-3 @cartas @habilidades
Característica: US-163 — La habilidad es de la carta, no del rol (D-27)

  Como jugador
  quiero que cada carta del mazo base tenga su propia habilidad, jugable desde
  cualquier unidad aliada como origen y con filtro por bando/rol/arquetipo
  para que la decisión de jugar una carta por su Orden (PO) o por su efecto
  tenga más matices tácticos que el gate de rol del MVP.

  Cubre FR-010, FR-014, FR-090, FR-093.

  Regla nueva (conmutable en estado.reglas.habilitarHabilidadesCarta, ON por
  defecto con D-27). Modelo:
  - Cada carta tiene su propio efecto del catálogo `HABILIDADES_POR_CARTA`
    (nombre, bando de objetivo, filtro opcional, efecto y magnitud FIJA).
  - Uso excluyente: Orden genera PO con el valor (1–3); Habilidad aplica el
    efecto SIN PO. La magnitud del efecto no depende del valor de la carta.
  - Jugar por habilidad consume la carta obligatoria del turno.
  - El origen es CUALQUIER unidad aliada (no hay gate de rol): el tipo
    Arma/Hechizo queda como metadato y no restringe quién canaliza.
  - El objetivo debe cumplir el filtro de la carta (bando + rol + arquetipo)
    y estar en rango y línea de visión del origen.
  - D-27 modifica D-25: elimina el rol canalizador (Mago→Hechizo, Guerrero→Arma).

  Contexto:
    Dado que comencé el turno
    Y que las habilidades de carta están habilitadas
    Y que no jugué aún mi carta obligatoria

  @must @FR-010
  Escenario: Jugar por habilidad no genera PO
    Dado que tengo en la mano la carta "🔥1" (Chispa)
    Y que tengo una unidad aliada como origen
    Cuando juego la carta como Habilidad apuntando a un enemigo a rango
    Entonces no se añade ningún PO a mi reserva
    Y la carta ya no está en mi mano
    Y la carta está en mi pila de descarte

  @must @FR-090
  Escenario: Jugar por habilidad consume la carta obligatoria del turno
    Cuando juego una carta como Habilidad
    Entonces el turno queda marcado como que ya se jugó la carta obligatoria
    Y no puedo jugar una segunda carta este turno

  @must
  Escenario: Cualquier unidad aliada puede ser origen (sin gate de rol)
    Dado que tengo en la mano la carta "🔥2" (Látigo, tipo Arma)
    Cuando la juego como Habilidad desde una unidad de rol Mago
    Entonces la habilidad se resuelve correctamente
    Y no se indica ninguna restricción de rol

  @must
  Escenario: El objetivo debe estar en rango y con línea de visión del origen
    Dado que tengo una unidad aliada como origen
    Y que el objetivo está a distancia mayor que su rango
    Cuando juego la carta como Habilidad apuntando a ese objetivo
    Entonces la acción es rechazada
    Y se indica que el objetivo está fuera de rango

  @must
  Escenario: Filtro de bando — una carta de aliado rechaza enemigos
    Dado que tengo la carta "💧2" (Ola, solo aliados)
    Y que apunto a una unidad enemiga
    Cuando intento jugar la carta como Habilidad
    Entonces la acción es rechazada
    Y se indica que la carta apunta solo a unidades aliadas

  @must
  Escenario: Filtro de bando — una carta de enemigo rechaza aliados
    Dado que tengo la carta "🔥1" (Chispa, solo enemigos)
    Y que apunto a una unidad aliada
    Cuando intento jugar la carta como Habilidad
    Entonces la acción es rechazada
    Y se indica que la carta apunta solo a unidades enemigas

  @must
  Escenario: Filtro por arquetipo — Escudo solo afecta a Torres
    Dado que tengo la carta "💧3" (Escudo, filtro Torre)
    Y que apunto a un Peón aliado
    Cuando intento jugar la carta como Habilidad
    Entonces la acción es rechazada
    Y se indica que la carta solo afecta a Torre

  @must
  Escenario: Filtro por rol — Avalancha solo afecta a Guerreros
    Dado que tengo la carta "🌍3" (Avalancha, filtro Guerrero)
    Y que apunto a un Alfil aliado
    Cuando intento jugar la carta como Habilidad
    Entonces la acción es rechazada
    Y se indica que la carta solo afecta a unidades Guerrero

  @must @FR-014
  Escenario: Flag apagado conserva el MVP anterior
    Dado que las habilidades de carta están deshabilitadas
    Cuando intento jugar la carta como Habilidad
    Entonces la acción es rechazada
    Y la carta permanece en mi mano
    Y jugarla como Orden sigue generando PO normalmente

  @must
  Escenario: Una carta sin habilidad no se puede jugar como habilidad
    Dado que tengo en la mano una carta sin entrada en el catálogo
    Cuando intento jugarla como Habilidad
    Entonces la acción es rechazada
    Y se indica que la carta no tiene habilidad

@epica-3 @cartas @habilidades
Característica: US-163 — Efectos propios de cada carta (magnitud fija)

  Como diseñador
  quiero que cada una de las 15 cartas del mazo base tenga un efecto único y de
  magnitud fija
  para que la carta se juegue por su utilidad específica y el valor solo
  importe para el PO de Orden.

  Contexto:
    Dado que comencé el turno
    Y que las habilidades de carta están habilitadas
    Y que aún no jugué mi carta obligatoria
    Y que el objetivo cumple el filtro y está a rango del origen

  @must
  Escenario: 🔥1 Chispa inflige 1 herida directa
    Dado que tengo en la mano "🔥1" y apunto a un enemigo
    Cuando la juego como Habilidad
    Entonces el enemigo recibe 1 herida

  @must
  Escenario: 🔥2 Látigo hiere y empuja 1 hex
    Dado que tengo en la mano "🔥2" y apunto a un enemigo
    Cuando la juego como Habilidad
    Entonces el enemigo recibe 1 herida
    Y retrocede 1 hex en dirección opuesta al origen

  @must
  Escenario: 🔥3 Bomba hiere al objetivo y a sus adyacentes
    Dado que tengo en la mano "🔥3"
    Y que junto al enemigo objetivo hay otro enemigo adyacente
    Cuando la juego como Habilidad
    Entonces el objetivo y cada enemigo adyacente reciben 1 herida

  @must
  Escenario: 💧1 Escarcha deja Stunned al enemigo
    Dado que tengo en la mano "💧1" y apunto a un enemigo
    Cuando la juego como Habilidad
    Entonces el enemigo queda con el estado Stunned

  @must
  Escenario: 💧2 Ola cura 2 heridas a un aliado
    Dado que tengo en la mano "💧2" y apunto a un aliado con 1 herida
    Cuando la juego como Habilidad
    Entonces el aliado sana hasta su vida máxima
    Y no supera su vida máxima

  @must
  Escenario: 💧3 Escudo otorga Muro a una Torre aliada
    Dado que tengo en la mano "💧3" y apunto a una Torre aliada
    Cuando la juego como Habilidad
    Entonces la Torre gana el efecto Muro (keep +1 en defensa)

  @must
  Escenario: 🌪️1 Vendaval suma +1 dado al ataque del aliado
    Dado que tengo en la mano "🌪️1" y apunto a un aliado
    Cuando la juego como Habilidad
    Entonces la próxima tirada de ataque del aliado recibe +1 dado
    Y el bono se consume en esa tirada y no se acumula

  @must
  Escenario: 🌪️2 Brisa suma +1 dado a la defensa del aliado
    Dado que tengo en la mano "🌪️2" y apunto a un aliado
    Cuando la juego como Habilidad
    Entonces la próxima tirada de defensa del aliado recibe +1 dado

  @must
  Escenario: 🌪️3 Corriente recupera la carta previa del descarte
    Dado que tengo en la mano "🌪️3"
    Y que mi descarte tiene al menos dos cartas
    Cuando la juego como Habilidad
    Entonces recupero a la mano la carta anterior a la jugada en el descarte
    Y la carta jugada queda en el descarte

  @must
  Escenario: 🌍1 Raíz guarda 1 token de Foco gratis
    Dado que tengo en la mano "🌍1" y apunto a un aliado con Foco no lleno
    Cuando la juego como Habilidad
    Entonces el aliado guarda 1 token de Tierra
    Y no supera su capacidad de Foco

  @must
  Escenario: 🌍2 Terremoto empuja 2 hexes a un enemigo
    Dado que tengo en la mano "🌍2" y apunto a un enemigo
    Cuando la juego como Habilidad
    Entonces el enemigo retrocede 2 hexes en dirección opuesta al origen

  @must
  Escenario: 🌍3 Avalancha otorga un Mover gratis a un Guerrero aliado
    Dado que tengo en la mano "🌍3" y apunto a un Guerrero aliado
    Cuando la juego como Habilidad
    Entonces el Guerrero puede Mover gratis este turno (solo mover, sin atacar)
    Y ese movimiento no consume PO ni toca el contador de acciones

  @must
  Escenario: ◼️1 Drenar quita 1 token de Foco al enemigo
    Dado que tengo en la mano "◼️1" y apunto a un enemigo con Foco
    Cuando la juego como Habilidad
    Entonces el enemigo pierde 1 token de Foco

  @must
  Escenario: ◼️2 Purga quita Stunned a un aliado
    Dado que tengo en la mano "◼️2" y apunto a un aliado Stunned
    Cuando la juego como Habilidad
    Entonces el aliado pierde el estado Stunned

  @must
  Escenario: ◼️3 Ruptura anula el Muro del enemigo
    Dado que tengo en la mano "◼️3" y apunto a un enemigo con Muro
    Cuando la juego como Habilidad
    Entonces el enemigo pierde el efecto Muro
    Y si no tenía Muro, su próxima tirada de defensa pierde 1 dado guardado

  @must
  Escenario: Mismo semilla + mismas intenciones = misma resolución
    Dado que ejecuto la misma secuencia de cartas-habilidades con la semilla X
    Cuando reproduzco la secuencia con la misma semilla
    Entonces obtengo exactamente el mismo estado resultante
