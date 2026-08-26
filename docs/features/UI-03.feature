# language: es

# =====================================================================
# ESCARAMUZA — ÉPICA UI-03
# Feedback de impacto global y calibración de tokens
# Fecha: 06/08/2026
#
# ESTADO DE BASE (verificado 06/08/2026)
# - Motor de reglas MVP completo. 251/251 tests en verde. build OK.
# - La lógica de src/engine/ y src/data/ NO debe modificarse.
# - UI-02 (US-092…US-103) ya está implementada: menú contextual,
#   movimiento animado, zonas de amenaza, feedback de combate, cartas
#   físicas, coste de próxima acción, retroceso animado, sonido, panel de
#   simulación, replay y telemetría. NO reimplementar.
# - YA EXISTE: sacudida del token en retroceso (US-099, .token-cuerpo.sacudida).
# - NO EXISTE todavía: screen shake global de la aplicación.
#
# REGLA GENERAL
# Estas historias mejoran la presentación y usabilidad del motor existente.
# No inventar reglas de juego nuevas.
# El screen shake se dispara SOLO por eventos reales del motor (estado.log),
# nunca por inferencia de la UI. No existe concepto de "crítico" en el MVP
# (GDD §19: diferido): la intensidad del shake se decide por tipo de evento,
# no por una regla de crítico inventada.
#
# NOTA DE VERIFICACIÓN: son historias de UI; los escenarios se verifican
# a mano en el navegador (regla del proyecto), no como tests Vitest.
# =====================================================================

@epica-12 @ui @ui-03
Característica: US-104 — Screen shake global por eventos de impacto

  Como jugador
  quiero percibir visualmente los impactos importantes en toda la pantalla
  para distinguir eventos normales de momentos decisivos del combate.

  # Justificación:
  # El tablero es el protagonista y hoy solo el token afectado recibe una
  # sacudida (US-099). Los impactos importantes (eliminaciones, heridas,
  # explosiones, retrocesos) deben sentirse en toda la pantalla sin tapar
  # la información. Es presentacional: se dispara por eventos del log del
  # motor, con intensidad según el tipo de evento, y respeta la preferencia
  # de animaciones reducidas del sistema.
  #
  # IMPORTANTE: el MVP no tiene críticos (GDD §19, diferido). El shake NO
  # inventa una condición de crítico mirando la diferencia de sumas: cada
  # tipo de evento del motor mapea a una intensidad fija. Cuando el motor
  # emita un evento de crítico en el futuro, esta US lo consumirá.

  @must @ui-03
  Escenario: Sacudida leve con una herida
    Dado que una unidad recibe una herida
    Cuando el motor registra el evento 'herida' en el log
    Entonces la aplicación debe ejecutar un screen shake de intensidad leve
    Y el resultado del motor debe permanecer sin cambios

  @must @ui-03
  Escenario: Sacudida fuerte con una eliminación
    Dado que una unidad es eliminada
    Cuando el motor registra el evento 'eliminacion' en el log
    Entonces la aplicación debe ejecutar un screen shake de intensidad fuerte

  @must @ui-03
  Escenario: Sacudida media con retroceso
    Dado que el combate provoca un retroceso (atacante o defensor)
    Cuando el motor registra 'retroceso' o 'retroceso-defensor' en el log
    Entonces la aplicación debe ejecutar un screen shake de intensidad media

  @must @ui-03
  Escenario: La explosión de un dado se percibe
    Dado que durante una tirada un dado obtiene un resultado explosivo
    Cuando el motor registra la explosión dentro del evento de ataque
    Entonces la aplicación debe ejecutar un screen shake acorde al evento
    Y no debe determinarse la intensidad por una regla de crítico inventada

  @should @ui-03
  Escenario: Sacudida breve y no bloqueante
    Dado que se ejecuta un screen shake
    Entonces la sacudida debe ser breve (inferior a medio segundo)
    Y no debe impedir que el jugador continúe interactuando

  @must @ui-03
  Escenario: Accesibilidad — animaciones reducidas del sistema
    Dado que el sistema operativo tiene activada la preferencia de reducir animaciones
    Cuando ocurre un evento que dispararía screen shake
    Entonces la sacudida no debe ejecutarse
    Y el resultado del combate debe seguir siendo completamente comprensible

  @must @ui-03
  Escenario: El shake no altera reglas
    Dado que se muestra cualquier screen shake
    Entonces el shake no debe modificar HP
    Y no debe modificar dados
    Y no debe modificar PO
    Y no debe modificar estados
    Y no debe cambiar la fase del turno


@epica-12 @ui @ui-03
Característica: US-105 — Calibración de sprites sobre el hexágono

  Como jugador
  quiero que los sprites de las unidades estén correctamente alineados con su hexágono
  para que el tablero se lea con claridad y la posición de cada unidad sea precisa.

  # Justificación:
  # Deuda técnica conocida del reporte UI-02 (05/08/2026): las imágenes de las
  # unidades se ven desplazadas respecto del hexágono. Esta historia corrige la
  # posición del sprite (pies cerca del centro/borde inferior del hex, cabeza
  # dentro del área del hex) sin tocar la lógica de posición del motor.
  #
  # Datos para implementar: aPixel(hex, 30) da el centro del hex; el sprite se
  # dibuja en UnitToken.jsx (SPRITE_W=38, SPRITE_H=40, BASE_Y=12). Ajustar la
  # geometría de presentación para que el punto de apoyo del sprite coincida
  # con el centro del hexágono.

  @must @ui-03
  Escenario: El sprite queda dentro de su hexágono
    Dado una unidad desplegada en el escenario base
    Cuando se renderiza el tablero
    Entonces el sprite de la unidad debe estar visualmente contenido en el área de su hexágono
    Y el punto de apoyo (pies) debe alinearse con el centro del hexágono

  @must @ui-03
  Escenario: Todos los arquetipos quedan alineados
    Dado que existen las seis arquetipos (Peón, Alfil, Torre, Caballo, Campeón, Rey)
    Cuando se renderizan en el tablero
    Entonces ninguno debe verse desplazado respecto del hexágono
    Y la variación entre arquetipos debe ser despreciable

  @must @ui-03
  Escenario: El fallback por glifo también queda alineado
    Dado que un sprite PNG no está disponible y se usa el glifo SVG de fallback
    Cuando se renderiza la unidad
    Entonces el glifo debe quedar igualmente centrado en el hexágono

  @should @ui-03
  Escenario: El indicador de amenaza no se ve tapado por el sprite
    Dado que una unidad está sobre su hexágono
    Cuando se muestra un overlay de selección o amenaza
    Entonces el overlay debe seguir siendo visible
    Y el sprite no debe tapar la información del hexágono
