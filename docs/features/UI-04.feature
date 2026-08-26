# language: es

# =====================================================================
# ESCARAMUZA — ÉPICA UI-04
# Cámara móvil del tablero (pan & zoom + reencuadre)
# Fecha: 11/08/2026
#
# ESTADO DE BASE (verificado 11/08/2026)
# - Motor de reglas MVP completo. 319/319 tests en verde. build OK.
# - La lógica de src/engine/ y src/data/ NO se modifica: la cámara es
#   100 % presentacional (transforma coordenadas visuales, no consume RNG
#   ni toca el estado).
# - Hito M3 del mapa ya cerrado: tablero rect 15×10 (150 hexes) con
#   escenario de río/vados/bloques (ver 13-escenario.feature).
# - El HUD (ronda/turno, fin de turno, ⚙, ⛶) es HTML flotante: queda fijo.
#
# REGLA GENERAL
# Estas historias mejoran la navegación de la pantalla de partida. No
# inventan reglas de juego. El centrado automático solo responde a la
# selección de unidad (decisión: no se sigue el combate a ciegas).
#
# NOTA DE VERIFICACIÓN: son historias de UI; los escenarios se verifican
# a mano en el navegador (regla del proyecto), no como tests Vitest.
# =====================================================================

@epica-14 @ui @ui-04
Característica: US-164 — Cámara móvil: enfocar la acción y navegar el mapa

  Como jugador
  quiero ver el tablero a un zoom que haga legibles a las unidades
  para no perder de vista la acción en un mapa de 150 hexágonos.

  # Justificación:
  # Con el mapa completo encajado, las unidades se ven chicas y "perdidas"
  # (efecto vista de pájaro). La cámara muestra una porción enfocada, se
  # mueve con pan/zoom y se centra sola en la unidad seleccionada, sin
  # tocar reglas ni romper el determinismo.

  Contexto:
    Dado que comencé una partida en el tablero rect 15×10

  @must @ui-04
  Escenario: El tablero arranca enfocado, no encajado
    Entonces la vista muestra una porción del tablero a zoom 1.25× por defecto
    Y las unidades se ven más grandes que con el encuadre completo

  @must @ui-04
  Escenario: Pan con botón derecho o medio
    Cuando arrastro el mapa con el botón derecho o el botón medio
    Entonces el mundo y el tablero se desplazan siguiendo el arrastre
    Y el HUD, la mano en abanico y la ficha de unidad permanecen fijos
    Y el menú contextual del navegador no se abre al arrastrar con derecho

  @must @ui-04
  Escenario: Zoom con la rueda del mouse
    Cuando giro la rueda sobre el tablero
    Entonces la vista hace zoom (1.0×–2.5×) centrado en el cursor
    Y el punto bajo el cursor no se desplaza mientras se hace zoom

  @must @ui-04
  Escenario: Centrado suave al seleccionar una unidad
    Cuando selecciono una unidad
    Entonces la cámara se centra suavemente (~320 ms) en su posición
    Y si arrastro o hago zoom durante el centrado, el centrado se cancela

  @must @ui-04
  Escenario: El botón de reencuadre vuelve al encuadre completo
    Dado que pané y apliqué zoom
    Cuando pulso el botón ⛶ (Reencuadrar tablero) del HUD
    Entonces la vista vuelve al encuadre completo del tablero (zoom 100 %)

  @should @ui-04
  Escenario: El modo esquemático navega igual
    Dado que activé el tablero esquemático desde Ajustes
    Cuando arrastro o hago zoom
    Entonces el tablero esquemático se navega igual que el inmersivo

  @should @ui-04
  Escenario: La viñeta y la luz cenital quedan fijas
    Cuando navego y hago zoom
    Entonces la viñeta de los bordes y la luz cenital se mantienen fijas
    Y las unidades conservan su sombra de suelo (anclaje al terreno)
