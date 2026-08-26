# language: es

# =====================================================================
# ESCARAMUZA — ÉPICA 19: DESPLIEGUE SIMÉTRICO ESTILO AJEDREZ (US-171)
# Retorna 6 unidades por bando (12 en mesa), los 6 arquetipos una vez c/u
# Fecha: 12/08/2026 — decisión D-38 (firme)
#
# ESTADO DE BASE (verificado 12/08/2026)
# - Implementado en src/data/scenarios.js (`desplieguePorDefecto`, 6
#   posiciones por bando) y src/engine/state.js (`crearUnidadesDespliegue`
#   con la plantilla completa Rey·Campeón·Alfil·Torre·Caballo·Peón).
# - D-38 (nuevo, aprobado 12/08/2026): despliegue fijo simétrico estilo
#   ajedrez, 6 por bando. Sustituye el 5+5 anterior de D-11; la asimetría
#   entre bandas queda en las habilidades de facción (US-170/D-37).
# - Fuente de verdad de los invariantes: src/tests/despliegue-simetrico.spec.js
#   y src/tests/inventario-produccion.spec.js.
# =====================================================================

@epica-19 @despliegue @unidades @asimetria
Característica: US-171 — Despliegue simétrico estilo ajedrez: 6 unidades por bando

  Como jugador
  quiero que cada bando despliegue los 6 arquetipos exactamente una vez
  para que la asimetría de la partida nazca de las cartas y no de la plantilla.

  # Justificación:
  # Ambas bandas juegan el mismo roster completo (Rey, Campeón, Alfil, Torre,
  # Caballo y Peón). La diferenciación táctica queda en las 4 habilidades
  # activas de cada facción (US-170/D-37). El despliegue es DATO de escenario
  # (scenarios.js): el motor solo ejecuta las posiciones declaradas.

  Contexto:
    Dado el escenario base rect 15×10

  @must @FR-002
  Escenario: Ambos bandos despliegan 6 unidades cada uno (12 en mesa)
    Cuando se crea la partida con el escenario base
    Entonces hay 6 unidades del jugador A y 6 del jugador B
    Y el total en mesa es 12 unidades

  @must @FR-002
  Escenario: Cada bando usa la plantilla completa de 6 arquetipos, una vez cada uno
    Dado el roster de unidades del jugador A
    Y el roster de unidades del jugador B
    Entonces ambos tienen exactamente un Rey, un Campeón, un Alfil, una Torre,
    un Caballo y un Peón

  @must @FR-002
  Escenario: Las posiciones de despliegue están libres y no se pisan
    Dado el escenario base
    Entonces ninguna unidad ocupa un hexágono bloqueado
    Y ninguna unidad comparte su hexágono con otra

  @should @FR-002
  Escenario: El despliegue simétrico aplica a Río Tajii y a las plantillas de mapa
    Dado el escenario río-tajii
    Cuando se crea la partida
    Entonces se despliegan 12 unidades (6 por bando)

  @should @FR-002
  Escenario: Los Reyes no quedan adyacentes entre sí en el arranque
    Dado el despliegue del escenario
    Entonces el Rey de A y el Rey de B quedan a distancia mayor a 1 hex