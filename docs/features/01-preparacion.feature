# language: es
@epica-2 @preparacion
Característica: US-001 — Catálogo de arquetipos

  Como diseñador
  quiero los seis arquetipos definidos como datos, no como código
  para poder afinar los perfiles después del playtest sin tocar el motor.

  Cubre FR-060, FR-062.

  @must @FR-060
  Escenario: Existen los seis arquetipos con perfil completo
    Dado el catálogo de arquetipos
    Cuando lo consulto
    Entonces contiene exactamente: Peón, Alfil, Torre, Caballo, Campeón y Rey
    Y cada uno declara Movimiento, Ataque, Defensa, Vida, Rango, Foco y Técnicas

  @must @FR-060
  Esquema del escenario: Valores de arranque de cada arquetipo
    Dado el arquetipo "<arquetipo>"
    Entonces su Movimiento es <mov>
    Y su Ataque es "<ataque>"
    Y su Defensa es "<defensa>"
    Y su Vida es <vida>
    Y su Rango es <rango>
    Y su Foco es <foco>

    Ejemplos:
      | arquetipo | mov | ataque | defensa | vida | rango | foco |
      | Peón      | 3   | 1g1    | 1g1     | 2    | 1     | 1    |
      | Alfil     | 4   | 2g1    | 1g1     | 2    | 3     | 2    |
      | Torre     | 2   | 2g1    | 2g1     | 4    | 1     | 1    |
      | Caballo   | 5   | 2g1    | 1g1     | 3    | 1     | 1    |
      | Campeón   | 4   | 2g2    | 2g1     | 4    | 2     | 3    |
      | Rey       | 3   | 1g1    | 2g2     | 4    | 1     | 2    |

  @should @FR-062
  Escenario: El Keep 2 está restringido
    Dado el catálogo de arquetipos
    Cuando busco unidades que guarden 2 dados
    Entonces solo el Campeón guarda 2 en Ataque
    Y solo el Rey guarda 2 en Defensa
    Y ninguna otra unidad guarda más de 1 dado

  @should
  Escenario: La ficha de unidad es visible en pantalla
    Cuando selecciono una unidad en el tablero
    Entonces veo su ficha con los seis atributos, sus heridas, sus tokens de Foco y sus estados


@epica-2 @preparacion
Característica: US-002 — Mazo de facción de 15 cartas

  Como jugador
  quiero un mazo propio de 15 cartas elementales
  para que cada carta jugada sea una decisión de economía.

  Cubre FR-001, FR-014.

  @must @FR-001
  Escenario: Cada jugador tiene 15 cartas
    Dado que inicio una partida entre dos facciones
    Cuando cuento las cartas de cada jugador sumando mazo, mano y descarte
    Entonces cada jugador tiene exactamente 15 cartas

  @must @FR-001
  Escenario: Estructura de la carta
    Dado cualquier carta del mazo
    Entonces tiene un elemento entre Fuego, Agua, Aire, Tierra y Vacío
    Y tiene un valor de Orden entre 1 y 3
    Y se muestra como el elemento seguido de su valor, por ejemplo "🔥3"

  @must @FR-014
  Escenario: En el MVP toda carta se juega como Orden
    Cuando selecciono una carta de mi mano
    Entonces la única función disponible es "Jugar como Orden"
    Y no existen las opciones de Equipo ni de Recurso

  @should @FR-001
  Escenario: Mazo simétrico de referencia
    Dado el mazo de prototipo
    Cuando lo inspecciono
    Entonces contiene un ejemplar de cada combinación de 5 elementos por 3 valores


@epica-2 @preparacion
Característica: US-003 — Bandas desplegadas

  Como jugador
  quiero mi banda de 4 a 6 miniaturas en el tablero al empezar
  para poder jugar sin una fase de despliegue.

  Cubre FR-002, FR-063 y la decisión D-11.

  @must @FR-002
  Escenario: Cada jugador controla entre 4 y 6 unidades
    Cuando inicia la partida
    Entonces cada jugador tiene entre 4 y 6 unidades en el tablero
    Y cada unidad tiene un arquetipo asignado y un identificador único
    Y cada jugador tiene exactamente un Rey

  @must @FR-002
  Escenario: El despliegue usa las posiciones del escenario base
    Cuando inicia la partida
    Entonces las unidades del jugador A ocupan las posiciones de despliegue A
    Y las del jugador B las posiciones de despliegue B
    Y ninguna unidad comparte hexágono con otra ni ocupa un hexágono bloqueado

  @should @FR-063
  Escenario: Las dos facciones son asimétricas
    Dado las dos facciones del MVP
    Cuando comparo sus bandas
    Entonces difieren en la composición de arquetipos o en la mezcla elemental del mazo
    Y la diferencia está declarada en los datos de facción, no en el motor


@epica-2 @preparacion
Característica: US-004 — Jugador inicial por moneda

  Como jugador
  quiero que la iniciativa se decida al azar y quede registrada
  para arrancar la primera ronda.

  Cubre FR-003.

  @must @FR-003
  Escenario: Se ejecuta la tirada de moneda
    Cuando inicia la partida
    Entonces se realiza una tirada de moneda usando el generador con semilla
    Y se registra en el log qué jugador comienza
    Y el turno activo es el de ese jugador

  @must @FR-003
  Escenario: La moneda es determinista con la misma semilla
    Dado dos partidas creadas con la semilla "playtest-01"
    Cuando comparo el resultado de la moneda
    Entonces es el mismo en ambas


@epica-2 @preparacion
Característica: US-005 — Mano inicial y robo

  Como jugador
  quiero una mano inicial y robar al comenzar mi turno
  para tener decisiones disponibles cada turno.

  Cubre FR-004 y la decisión D-08 (mano de 5, robo de 1 por turno).
  El tamaño es un valor de arranque configurable en "data/rules.js".

  @should @FR-004
  Escenario: Reparto inicial
    Cuando inicia la partida
    Entonces cada jugador tiene 5 cartas en la mano
    Y su mazo tiene 10 cartas restantes

  @should @FR-004
  Escenario: Robo al inicio del turno
    Dado que es mi turno y tengo 3 cartas en la mano
    Cuando comienza mi turno
    Entonces robo 1 carta
    Y tengo 4 cartas en la mano

  @should @FR-004
  Escenario: Mazo agotado
    Dado que mi mazo está vacío
    Cuando comienza mi turno
    Entonces no robo ninguna carta
    Y la partida continúa sin error

  @should
  Escenario: La mano rival está oculta
    Cuando observo el panel del oponente
    Entonces veo la cantidad de cartas que tiene
    Pero no veo su contenido
