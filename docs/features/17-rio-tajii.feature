# language: es

# =====================================================================
# ESCARAMUZA — ÉPICA 17: ESCENARIO RÍO TAJII
# Campo de batalla del río: victoria por objetivos (D-33/34/35)
# Fecha: 12/08/2026
#
# ESTADO DE BASE (verificado 12/08/2026)
# - Terreno por tile (D-29/30/31) y victoria por objetivos (D-33/34/35)
#   implementados: `reglasTerreno` en data/rules.js, `objetivos.js` en el
#   motor, `estado.marcador` en el estado.
# - Este escenario es el playtest que AMBOS sistemas necesitan: un río
#   longitudinal con cruces disputados obliga a decidir cómo atacar y a
#   quién recompensar con estandartes.
# - Fuente de verdad de los invariantes: src/tests/rio-tajii.spec.js y
#   src/tests/reglas-terreno.spec.js, src/tests/victoria-objetivos.spec.js.
#
# D-36 (aprobado 12/08/2026): el reskin Mouri/Takeda es SOLO cosmético
# (UI); el motor sigue A/B con mazos elementales.
# =====================================================================

@epica-17 @escenario @objetivos @terreno
Característica: US-167 — Río Tajii: tablero 13×9 con río, puente y victoria por estandartes

  Como jugador
  quiero un campo de batalla con un río que cruzar y un puente que disputar
  para que la victoria mida control del terreno y no solo bajas.

  # Justificación:
  # Las plantillas 15×10 de D-28 probaron agua sin LoS y pasos estrechos.
  # Río Tajii agrega el terreno CON reglas (D-29/30/31: empalizada y puente)
  # y el sistema de objetivos (D-33/34/35): el río longitudinal fuerza el
  # cruce por vados o el puente central, y el puente es el objetivo de
  # victoria. La conectividad se garantiza por test (BFS).

  Contexto:
    Dado el escenario rio-tajii cargado por obtenerEscenario

  @must @mapa
  Escenario: Es un rectángulo 13×9 con río, dos vados, un puente y empalizadas
    Entonces la forma es un rectángulo de 13 columnas por 9 filas (117 hexes)
    Y el puente central está libre y se pinta como 'puente'
    Y hay exactamente 2 vados libres pintados como 'camino'
    Y hay 2 empalizadas libres que cuestan +1 movimiento al cruzarlas
    Y el agua del río bloquea el movimiento pero no la línea de visión

  @must @conectividad
  Escenario: Ambos bandos quedan conectados a través del río
    Dado el despliegue A del escenario
    Y el despliegue B del escenario
    Entonces cada hex de despliegue A alcanza por BFS a cada hex de despliegue B
    Y el hex del puente es alcanzable desde todos los despliegues

  @must @objetivos
  Escenario: El escenario declara el puente y el lado enemigo para la victoria por objetivos
    Dado que el escenario define tablero.objetivos
    Entonces el hex del puente es { q: -2, r: 0 }
    Y el lado enemigo de A son los hexes transitables del sur del río (filas 5-8)
    Y el lado enemigo de B son los hexes transitables del norte del río (filas 0-3)
    Y el marcador de estandartes nace en 0 para ambos bandos

  @should @integración
  Escenario: La partida arranca con el escenario Río Tajii activo
    Dado que creo una partida con semilla y escenario 'rio-tajii'
    Entonces el estado trae tablero.objetivos con el puente del escenario
    Y despliega 6 unidades por bando en sus posiciones del escenario (12 en mesa, D-38)
    Y el marcador de estandartes empieza en { A: 0, B: 0 }
