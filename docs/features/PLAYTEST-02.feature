# language: es

# =====================================================================
# ESCARAMUZA — ÉPICA PLAYTEST-02
# Telemetría profunda por arquetipo
# Fecha: 06/08/2026
#
# ESTADO DE BASE (verificado 06/08/2026)
# - Motor de reglas MVP completo. 251/251 tests en verde. build OK.
# - La lógica de src/engine/ y src/data/ NO debe modificarse.
# - La instrumentación existente NO se reimplementa:
#     * sim/bots.js (3 políticas), sim/correr.js, sim/reporte.js,
#       sim/jugar-partida.js, sim/resultados.json (campaign 3000 partidas).
#     * sim/metricas.js -> metricasDePartida(estado) ya calcula los 6 watch
#       points, incluido `heridasPorArquetipo` (solo del lado atacante).
#     * src/engine/metrics.js (métricas por partida).
#     * UI: SimulationPanel.jsx (panel en navegador) + TopHUD "Simular".
# - LO QUE FALTA (esta épica): métricas profundas POR ARQUETIPO desde ambos
#   lados (atacante y defensor) para detectar unidades fuertes/débiles.
#
# REGLA GENERAL
# Es instrumentación de análisis. Vive en sim/ y en el panel de la UI.
# No toca el motor ni modifica reglas. Reutiliza el log del motor.
# =====================================================================

@epica-13 @playtest @instrumentacion
Característica: US-106 — Métricas profundas por arquetipo

  Como diseñador
  quiero conocer el rendimiento de cada arquetipo desde ambos lados del combate
  para detectar unidades demasiado fuertes o débiles sin jugar a mano.

  # Justificación:
  # Hoy `sim/metricas.js` solo reporta `heridasPorArquetipo` (lado atacante).
  # Para balancear hace falta ver el desempeño completo de cada arquetipo:
  # daño realizado/recibido, veces atacando, veces derrotado, rondas
  # sobrevividas, técnicas y foco utilizados. Se deriva del log del motor
  # (eventos 'ataque', 'herida', 'eliminacion', 'concentracion', 'tecnica')
  # y se agrega al reporte CLI y al panel del navegador.
  #
  # REUTILIZAR, NO REESCRIBIR:
  # - metricasDePartida() (sim/metricas.js) como base.
  # - sim/reporte.js para las columnas nuevas del CLI.
  # - SimulationPanel.jsx para mostrar el desglose por arquetipo en el
  #   navegador (resumenDePartida ya agrega por partida).
  # - El log ya tiene en cada evento 'ataque': arquetipoAtacante,
  #   arquetipoDefensor, resultado, y las tiradas completas.

  @must @playtest
  Escenario: Calcular métricas por arquetipo desde el log
    Dado un estado de partida finalizado con log completo
    Cuando se ejecuta metricasDePartida()
    Entonces el resultado debe incluir un objeto `arquetipos`
    Y ese objeto debe tener una entrada por cada arquetipo presente

  @must @playtest
  Escenario: Daño realizado y recibido por arquetipo
    Dado un arquetipo que participó de intercambios
    Entonces `arquetipos[arquetipo]` debe incluir:
      | Métrica |
      | vecesAtacando |
      | dañoRealizado |
      | vecesDefendiendo |
      | dañoRecibido |

  @must @playtest
  Escenario: Baja por arquetipo
    Dado que unidades de un arquetipo fueron eliminadas
    Entonces `arquetipos[arquetipo]` debe incluir `vecesDerrotado`

  @must @playtest
  Escenario: Supervivencia y recursos por arquetipo
    Dado un arquetipo en la partida
    Entonces `arquetipos[arquetipo]` debe incluir:
      | Métrica |
      | rondasSobrevividas |
      | tecnicasUtilizadas |
      | focoUtilizado |

  @must @playtest
  Escenario: No modificar el motor
    Dado que se calculan métricas por arquetipo
    Entonces no debe modificarse ninguna regla del motor
    Y no debe cambiarse el estado de la partida

  @should @playtest
  Escenario: El reporte CLI muestra el desglose por arquetipo
    Dado que existe sim/resultados.json
    Cuando se ejecuta sim/reporte.js
    Entonces el reporte debe incluir una sección por arquetipo
    Y debe mostrar las métricas de la sección anterior agregadas

  @should @playtest
  Escenario: El panel del navegador muestra el desglose por arquetipo
    Dado que el desarrollador abre el panel de simulación
    Cuando finaliza una corrida
    Entonces el panel debe mostrar las métricas por arquetipo agregadas
    Y debe permitir identificar visualmente los arquetipos con peor desempeño

  @should @playtest
  Escenario: Comparación entre facciones
    Dado que Fuego y Agua usan los mismos arquetipos en sus bandas
    Cuando se agregan las métricas
    Entonces debe poder compararse el desempeño del mismo arquetipo por facción
