# language: es

# =====================================================================
# ESCARAMUZA — ÉPICA 13: ESCENARIO_BASE
# Mapa del playtest: tablero rect 15×10 y datos del escenario
# Fecha: 11/08/2026
#
# ESTADO DE BASE (verificado 11/08/2026)
# - Hito M3 del mapa implementado. 319/319 tests en verde. build OK.
# - El escenario es DATO (src/data/scenarios.js): el motor solo conoce
#   `tablero.forma` + `tablero.bloqueados` + `tablero.lugares`, jamás el
#   terreno. El terreno visual (src/ui/terreno.js) pinta por región y es
#   100 % cosmético.
# - Fuente de verdad de los invariantes: src/tests/escenario.spec.js.
#
# REGLA GENERAL
# Los escenarios de esta Característica se verifican con los tests del
# motor (BFS de conectividad, geometría); no agregan reglas nuevas.
# =====================================================================

@epica-13 @escenario @mapa
Característica: US-163 — Escenario base: tablero rect 15×10 con río, bloques y despliegues

  Como jugador
  quiero un tablero rectangular táctico con obstáculos y cruces
  para que el playtest mida maniobra y no solo DPS frente a frente.

  # Justificación:
  # El tablero radial de 61/127 hexes favorece el cuerpo a cuerpo sin
  # decisiones de ruta. El rect 15×10 (150 hexes) con un río central, dos
  # vados y bloques de bosque/montaña obliga a elegir por dónde cruzar.
  # La conectividad se garantiza por test (BFS): ningún cruce es un muro.

  Contexto:
    Dado el escenario base ESCENARIO_BASE

  @must @mapa
  Escenario: Es un rectángulo 15×10 con 23 bloqueados y 3 lugares libres
    Entonces la forma es un rectángulo de 15 columnas por 10 filas (150 hexes)
    Y hay 23 hexágonos bloqueados
    Y hay 3 lugares, ninguno de ellos bloqueado

  @must @mapa
  Escenario: El río deja los dos vados libres y bloquea el resto de la fila r=0
    Dado que la fila r=0 es el río central
    Entonces los vados (0,0) y (-6,0) NO están bloqueados
    Y el resto de la fila r=0 sí está bloqueado

  @must @mapa
  Escenario: Los bloques de bosque y montaña son acentos tácticos bloqueados
    Entonces hay un bloque de bosque de 5 hexes al noroeste
    Y hay un bloque de montaña de 5 hexes al sureste

  @must @mapa
  Escenario: Los pares despliegue-A ↔ despliegue-B quedan conectados
    Dado el despliegue A con 6 hexes (D-38)
    Y el despliegue B con 6 hexes (D-38)
    Cuando recorro el grafo de hexes libres desde cada hex de despliegue A
    Entonces desde cada uno alcanzo los 6 hexes del despliegue B
    Y ningún hex de despliegue está bloqueado
    Y los lugares no se pisan con los despliegues

  @must @mapa
  Escenario: Cada lugar es alcanzable desde todos los hexes de despliegue
    Cuando recorro el grafo de hexes libres desde cada hex de despliegue
    Entonces alcanzo los 3 lugares desde los 12 hexes de despliegue
