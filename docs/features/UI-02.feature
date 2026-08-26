# language: es

# =====================================================================
# ESCARAMUZA — ÉPICA UI-02
# Evolución visual e interacción del prototipo
# Fecha: 06/08/2026
#
# ESTADO DE BASE (verificado 06/08/2026)
# - Motor de reglas MVP completo. 251/251 tests en verde. build OK.
# - La lógica de src/engine/ y src/data/ NO debe modificarse salvo
#   que una US lo requiera explícitamente.
# - YA EXISTEN (no reimplementar):
#     * export/import de replay JSON: src/engine/registro.js
#       (exportarRegistro / reproducirPartida) cableados en App.jsx.
#     * bots de simulación: sim/bots.js (botAleatorioLegal, botCodicioso,
#       botAhorrador) + sim/metricas.js + sim/reporte.js + npm run sim.
#     * métricas de partida: src/engine/metrics.js (metricasDePartida).
#     * curva de costes 1/2/3/5 configurable: estado.reglas.costesAccion.
#     * overlay de combate CombatResult.jsx que YA muestra "EXPLOSIÓN".
# - La interfaz actual ya utiliza tablero SVG, sprites PNG (12 unidades en
#   public/assets/units/), TopHUD, RosterPanel, HandPanel, POBar, ActionMenu,
#   UnitSheet, LogPanel, CombatResult.
#
# REGLA GENERAL
# Estas historias mejoran la presentación y usabilidad del motor existente.
# No inventar reglas de juego nuevas.
# No cambiar costes, estadísticas, efectos de Técnicas, condiciones de
# victoria ni comportamiento del combate salvo que una US lo indique.
#
# NOTA DE VERIFICACIÓN: son historias de UI; los escenarios se verifican
# a mano en el navegador (regla del proyecto), no como tests Vitest.
# Los escenarios que tocan mecánicas ya cubiertas por tests del motor son
# de VERIFICACIÓN, no de implementación.
#
# PRINCIPIOS VISUALES
# - El tablero es el protagonista.
# - La información importante debe aparecer cerca de la unidad afectada.
# - Las animaciones deben ser cortas y funcionales, no cinematográficas,
#   y no deben bloquear al jugador más de lo necesario.
# - Mantener estética JRPG táctico de 16 bits / juego de mesa fantástico.
# - Mantener paleta existente: madera, pergamino, oro, verde prado y
#   colores elementales.
# - Mantener escalado fluido basado en 1440x810.
# =====================================================================

@epica-11 @ui @ui-02
Característica: US-092 — Menú contextual de unidad seleccionada

  Como jugador
  quiero ver las acciones de mi unidad junto a ella
  para decidir con el menor desplazamiento visual posible.

  # Justificación:
  # El ActionMenu actual está alejado del punto de decisión. El menú
  # contextual acerca las acciones al tablero sin eliminar el ActionMenu
  # existente como fallback.

  @must @ui-02
  Escenario: Mostrar acciones disponibles junto a la unidad seleccionada
    Dado que es el turno del jugador activo
    Y el jugador selecciona una unidad propia
    Cuando la unidad queda seleccionada
    Entonces debe aparecer un menú contextual flotante junto al hexágono
    Y el menú debe mostrar las acciones actualmente disponibles
    Y debe respetar los costes actuales de PO
    Y no debe mostrar acciones que la unidad no pueda ejecutar

  @must @ui-02
  Escenario: Mantener las acciones existentes
    Dado que el menú contextual está visible
    Cuando el jugador selecciona "Mover"
    Entonces debe activarse el mismo flujo de movimiento existente

  @must @ui-02
  Escenario: Mantener el ActionMenu como fallback
    Dado que una unidad está seleccionada
    Entonces el ActionMenu existente no debe perder funcionalidad
    Y el nuevo menú contextual debe utilizar las mismas acciones y callbacks
    Y no debe duplicar lógica del motor

  @should @ui-02
  Escenario: No mostrar acciones contextuales para una unidad rival
    Dado que es el turno del jugador activo
    Cuando el jugador selecciona una unidad rival
    Entonces no debe aparecer el menú de acciones propias

  # Nota de implementación: las acciones se obtienen del selector existente
  # obtenerAcciones() (src/ui/adapter.js). El menú contextual solo reposiciona
  # la misma lista.


@epica-11 @ui @ui-02
Característica: US-093 — Animación de movimiento de unidades

  Como jugador
  quiero ver desplazarse a mis unidades entre hexágonos
  para que el tablero se sienta como un juego táctico real.

  # Justificación:
  # Actualmente una unidad cambia instantáneamente de hexágono. Una
  # transición breve permite percibir el desplazamiento sin alterar las
  # reglas.
  #
  # Datos para implementar: el evento de log tipo 'movimiento' y la
  # comparación pos.q/pos.r en App.jsx (despachar) dan origen y destino.
  # La animación es puramente presentacional: al terminar, la posición SVG
  # debe coincidir exactamente con la del estado.

  @must @ui-02
  Escenario: Animar el movimiento entre hexágonos
    Dado que una unidad puede moverse desde un hexágono origen
    Cuando el jugador confirma un movimiento
    Entonces la unidad debe desplazarse visualmente desde el origen hasta el destino
    Y la transición debe ser breve y suave
    Y la posición final debe coincidir exactamente con el estado del motor

  @should @ui-02
  Escenario: Mostrar la ruta durante el movimiento
    Dado que el jugador está en modo Mover
    Cuando existe una ruta válida hacia un destino
    Entonces la ruta debe permanecer visualmente identificable
    Y la animación debe seguir la ruta calculada

  @must @ui-02
  Escenario: No alterar el estado del motor durante la animación
    Dado que una unidad está ejecutando una animación de movimiento
    Cuando termina la animación
    Entonces la posición lógica de la unidad debe ser la definida por el motor
    Y la animación no debe crear movimientos adicionales


@epica-11 @ui @ui-02
Característica: US-094 — Zonas de amenaza enemigas

  Como jugador
  quiero ver qué hexágonos puede atacar una unidad enemiga al pasar el cursor
  para evaluar el riesgo de una posición antes de mover.

  # Justificación:
  # La planificación táctica es una parte central del juego.
  #
  # Datos para implementar: primitivos existentes del motor — hexEnRadio()
  # (src/engine/hex.js), hayLoS() (src/engine/hex.js) y objetivosAtaque()
  # (src/engine/selectors.js). Mostrar hexes amenazados es presentacional:
  # se deriva con esas funciones, no se reimplementan las reglas.

  @must @ui-02
  Escenario: Mostrar amenaza de ataque al inspeccionar una unidad enemiga
    Dado que existen unidades enemigas capaces de atacar
    Cuando el jugador pasa el cursor sobre una unidad enemiga
    Entonces deben resaltarse sutilmente los hexágonos que dicha unidad podría atacar según su rango actual
    Y el overlay debe ser visualmente distinto de los overlays utilizados para acciones propias

  @should @ui-02
  Escenario: No mostrar amenazas fuera del rango
    Dada una unidad enemiga con rango limitado
    Cuando el jugador inspecciona sus posibles objetivos
    Entonces ningún hexágono fuera de su rango debe aparecer como amenazado

  @must @ui-02
  Escenario: No modificar las reglas de LoS
    Dado que una posición está fuera de línea de visión
    Cuando se calculan las amenazas
    Entonces dicha posición no debe mostrarse como objetivo válido si la regla existente de LoS impide el ataque


@epica-11 @ui @ui-02
Característica: US-095 — Indicadores flotantes de combate

  Como jugador
  quiero ver heridas, explosiones y estados sobre la unidad afectada
  para percibir el combate sin tener que leer el log.

  # Justificación:
  # El combate utiliza dados, explosiones, heridas y estados. Los eventos
  # importantes deben percibirse inmediatamente.
  #
  # Datos para implementar: los eventos YA existen en estado.log — 'herida',
  # 'stunned', 'retroceso', 'retroceso-defensor', 'eliminacion' y 'ataque'
  # con su detalle (dados con explosión en datosAtaque). App.jsx ya difiere
  # log nuevo vs viejo en despachar(). El indicador flotante se dispara por
  # esos eventos reales; NUNCA por inferencia de la UI.
  #
  # Nota: el overlay CombatResult.jsx YA muestra "EXPLOSIÓN" dentro de la
  # pantalla de dados. Esta historia agrega el texto flotante SOBRE la
  # unidad afectada; no reemplaza el overlay ni el Combat Log.

  @must @ui-02
  Escenario: Mostrar pérdida de vida
    Dado que una unidad recibe una herida
    Cuando el combate termina
    Entonces debe aparecer un indicador flotante "-1 HP"
    Y debe mostrarse sobre la unidad afectada
    Y debe desaparecer automáticamente después de un breve intervalo

  @must @ui-02
  Escenario: Mostrar explosión de dado
    Dado que durante una tirada un dado obtiene un resultado explosivo
    Cuando el motor registra la explosión
    Entonces debe aparecer un indicador visual "EXPLOSIÓN"
    Y debe utilizar una presentación destacada
    Y debe asociarse visualmente con el resultado del combate

  @must @ui-02
  Escenario: Mostrar Stunned
    Dado que una unidad recibe el estado Stunned
    Cuando el estado es aplicado
    Entonces debe aparecer un indicador "STUNNED"
    Y debe utilizar un tratamiento visual claramente diferenciable
    Y debe desaparecer después de un breve intervalo

  @should @ui-02
  Escenario: Mostrar retroceso
    Dado que el motor registra un evento 'retroceso' o 'retroceso-defensor'
    Cuando el evento se emite
    Entonces debe aparecer un indicador de desplazamiento sobre la unidad movida
    Y debe acompañar la animación de retroceso sin cambiar su resultado

  @should @ui-02
  Escenario: Mostrar los eventos sin reemplazar el Combat Log
    Dado que ocurre un evento visual de combate
    Entonces el Combat Log debe continuar registrando el evento
    Y los indicadores flotantes deben funcionar como feedback adicional


@epica-11 @ui @ui-02
Característica: US-096 — Presentación visual de las cartas de la mano

  Como jugador
  quiero que las cartas de mi mano se sientan como objetos físicos de juego de mesa
  para reconocer de un vistazo mi mano sin perder legibilidad.

  # Justificación:
  # Las cartas son uno de los componentes centrales del diseño.

  @should @ui-02
  Escenario: Mostrar la mano como abanico
    Dado que el jugador posee varias cartas
    Cuando se muestra la mano
    Entonces las cartas deben distribuirse con un ligero efecto de abanico
    Y las cartas deben permanecer parcialmente superpuestas
    Y cada carta debe seguir siendo identificable

  @should @ui-02
  Escenario: Elevar una carta al pasar el cursor
    Dado que una carta está en la mano
    Cuando el jugador pasa el cursor sobre ella
    Entonces la carta debe elevarse respecto de las demás
    Y debe aumentar ligeramente su protagonismo visual
    Y las cartas vecinas no deben desaparecer

  @should @ui-02
  Escenario: Mostrar claramente el elemento y PO
    Dado que una carta está visible
    Entonces su elemento debe ser reconocible inmediatamente
    Y su valor de PO debe permanecer legible
    Y el efecto visual no debe tapar la información de la carta

  @must @ui-02
  Escenario: No alterar la funcionalidad de la mano
    Dado que una carta está visualmente elevada
    Cuando el jugador hace click sobre ella
    Entonces debe ejecutarse exactamente la misma acción existente
    Y no debe modificarse el valor de PO generado


@epica-11 @ui @ui-02
Característica: US-097 — Indicador de progresión de acciones

  Como jugador
  quiero ver cuánto costará la próxima acción de mi unidad
  para no tener que recordar la curva 1/2/3/5.

  # Justificación:
  # La curva actual del motor es 1/2/3/5 PO por unidad (estado.reglas.costesAccion).
  #
  # ESTADO ACTUAL (verificado): el coste ya se muestra en el ActionMenu
  # (obtenerAcciones), en el UnitSheet (prop costeProxima) y en el hint de
  # App.jsx. Lo nuevo de esta historia:
  #   1) mostrarlo también junto a la unidad (cerca del punto de decisión),
  #   2) enfatizar el estado "no disponible" cuando el coste supera los PO,
  #   3) verificar que siempre sale del selector costeProximaAccion() y de
  #      estado.reglas.costesAccion, nunca de constantes de la UI.

  @must @ui-02
  Escenario: Mostrar el siguiente coste de acción
    Dado que una unidad puede ejecutar una acción
    Cuando la unidad está seleccionada
    Entonces debe mostrarse el coste correspondiente a su próximo escalón
    Y el valor debe obtenerse del estado/reglas actual
    Y no debe estar hardcodeado exclusivamente en la UI

  @must @ui-02
  Escenario: Actualizar el coste después de una acción
    Dado que una unidad ya realizó una acción
    Cuando el contador de acciones cambia
    Entonces el indicador debe actualizarse
    Y debe mostrar el coste correspondiente al siguiente escalón

  @must @ui-02
  Escenario: Mostrar claramente la falta de PO
    Dado que el siguiente coste supera los PO disponibles
    Entonces el coste debe mostrarse como no disponible
    Y la acción no debe poder ejecutarse

  @should @ui-02
  Escenario: Respetar el contador individual
    Dado que dos unidades tienen diferentes cantidades de acciones realizadas
    Cuando ambas son seleccionadas en momentos diferentes
    Entonces cada una debe mostrar su propio siguiente coste


@epica-11 @ui @ui-02
Característica: US-098 — Indicador visual de unidad agotada (PREPARADA, no implementar aún)

  Como diseñador
  quiero dejar lista la UI para un futuro estado Agotado del motor
  para que, cuando exista, la unidad sea reconocible sin inventar el estado.

  # Justificación:
  # Esta funcionalidad solo debe implementarse si el estado "Agotado"
  # está formalmente incorporado al motor. NO inventar el estado desde la
  # UI. Actualmente se considera una integración preparada para una decisión
  # de reglas posterior.

  @wont @ui-02
  Escenario: Mostrar una unidad agotada
    Dado que el motor informa que una unidad está en estado Agotado
    Cuando se renderiza la unidad
    Entonces debe mostrarse un indicador visual distintivo
    Y la unidad debe ser reconocible como agotada incluso a escala reducida

  @wont @ui-02
  Escenario: Mantener la unidad agotada en el tablero
    Dado que una unidad está agotada
    Entonces su sprite debe permanecer visible
    Y su barra de vida debe continuar visible
    Y el indicador de agotamiento debe ser adicional al sprite

  @must @ui-02
  Escenario: No inventar agotamiento en la UI
    Dado que el motor no informa el estado Agotado
    Entonces la UI no debe inferirlo por cantidad de acciones
    Y no debe crear un nuevo estado lógico


@epica-11 @ui @ui-02
Característica: US-099 — Feedback visual de retroceso

  Como jugador
  quiero ver animado el retroceso de una unidad empujada por el combate
  para comprender por qué se desplazó sin leer el log.

  # Justificación:
  # El retroceso ya forma parte del lenguaje de combate del MVP.
  #
  # Importante: no introducir aquí una regla nueva de "crítico a 7+".
  # La animación debe reaccionar exclusivamente a eventos reales emitidos
  # por el motor ('retroceso' = atacante pierde; 'retroceso-defensor' =
  # gana por diferencia >= 2, flag retrocesoDefensorDiferencia2).
  #
  # NOTA PARA PLAYTEST: retrocesoDefensorDiferencia2 está OFF por defecto.
  # Para probar la animación del defensor hay que activar ese flag en el
  # panel de reglas. La animación debe cubrir ambos eventos sin importar
  # el valor del flag.

  @must @ui-02
  Escenario: Animar retroceso de una unidad
    Dado que el resultado del combate provoca retroceso
    Cuando el motor aplica el desplazamiento
    Entonces la unidad debe animarse desde su posición anterior
    Y debe desplazarse hacia el hexágono correspondiente
    Y debe terminar exactamente en la posición lógica resultante

  @should @ui-02
  Escenario: Diferenciar retroceso de movimiento voluntario
    Dado que una unidad es desplazada como consecuencia del combate
    Entonces la animación debe utilizar un feedback visual diferente al movimiento voluntario
    Y puede utilizar una sacudida breve o efecto de impacto

  @must @ui-02
  Escenario: No alterar la resolución del combate
    Dado que se reproduce la animación de retroceso
    Entonces no debe ejecutarse ningún movimiento adicional
    Y el motor debe conservar exactamente su resultado original


@epica-11 @ui @ui-02
Característica: US-100 — Efectos de sonido ligeros

  Como jugador
  quiero feedback de sonido breve en las acciones importantes
  para sentir el juego sin una experiencia audiovisual pesada.

  # Justificación:
  # El sonido debe reforzar acciones importantes sin transformar el
  # prototipo en una experiencia audiovisual pesada.
  #
  # Datos para implementar: un SoundManager reutilizable (WebAudio con
  # fallback silencioso). Sin assets nuevos obligatorios: pueden usarse
  # osciladores simples. Si no hay audio disponible, el juego sigue igual.

  @should @ui-02
  Escenario: Reproducir sonido al lanzar dados
    Dado que comienza una resolución de combate
    Cuando se muestra el overlay de dados
    Entonces debe reproducirse un sonido breve asociado al lanzamiento

  @should @ui-02
  Escenario: Reproducir sonido al impactar
    Dado que el atacante gana el combate
    Cuando se aplica la herida
    Entonces debe reproducirse un sonido breve de impacto

  @should @ui-02
  Escenario: Reproducir sonido al jugar una carta
    Dado que el jugador juega una carta como Orden
    Cuando la carta es aceptada por el motor
    Entonces debe reproducirse un sonido breve de carta

  @should @ui-02
  Escenario: Reproducir fanfarria de victoria
    Dado que se alcanza una condición de victoria
    Cuando el motor confirma el final de la partida
    Entonces debe reproducirse una fanfarria breve

  @must @ui-02
  Escenario: No bloquear el juego si el audio no está disponible
    Dado que el navegador bloquea o no permite reproducir audio
    Entonces el juego debe continuar funcionando normalmente


@epica-11 @ui @ui-02
Característica: US-101 — Panel de simulación Bot vs Bot (en el navegador)

  Como desarrollador
  quiero correr simulaciones de partidas desde el navegador
  para balancear sin salir del prototipo.

  # Justificación:
  # El motor ya es determinista y la simulación CLI existe (sim/bots.js con
  # 3 políticas, sim/correr.js, sim/metricas.js). Este panel lleva esa
  # herramienta al navegador.
  #
  # REUTILIZAR, NO REESCRIBIR:
  # - Las políticas ya existen en sim/bots.js (botAleatorioLegal,
  #   botCodicioso, botAhorrador). El panel debe importarlas y usarlas.
  # - Las métricas por partida ya existen en src/engine/metrics.js y
  #   sim/metricas.js.
  # - NO escribir bots nuevos. Si se quiere una política distinta, pedirlo.

  @must @ui-02
  Escenario: Ejecutar una simulación automática
    Dado que el desarrollador abre el panel de simulación
    Cuando selecciona una cantidad de partidas y las políticas de cada lado
    Y inicia la simulación
    Entonces el sistema debe ejecutar las partidas utilizando el motor existente
    Y cada partida debe jugarse con las políticas de sim/bots.js
    Y la simulación no debe depender de animaciones de la UI

  @must @ui-02
  Escenario: Utilizar semillas reproducibles
    Dado que una simulación comienza con una semilla conocida
    Cuando se vuelve a ejecutar la misma simulación
    Entonces debe producir los mismos resultados deterministas

  @must @ui-02
  Escenario: Mostrar porcentaje de victorias por facción
    Dado que finalizó una serie de simulaciones
    Entonces debe mostrarse el porcentaje de victorias de Fuego
    Y debe mostrarse el porcentaje de victorias de Agua

  @should @ui-02
  Escenario: Mostrar duración media de las partidas
    Dado que finalizaron varias simulaciones
    Entonces debe mostrarse el promedio de rondas por partida

  @should @ui-02
  Escenario: Mostrar métricas de Foco
    Dado que finalizaron varias simulaciones
    Entonces debe mostrarse información agregada de Foco
    Y la métrica debe diferenciarse claramente de PO

  @must @ui-02
  Escenario: No modificar el motor durante la simulación
    Dado que se ejecuta una simulación
    Entonces la simulación debe utilizar las reglas existentes
    Y no debe modificar las reglas globales del juego


@epica-11 @ui @ui-02
Característica: US-102 — Replay: copiar al portapapeles y reproducir visualmente

  Como desarrollador
  quiero copiar un replay al portapapeles y reproducirlo paso a paso
  para compartir y revisar partidas de playtest.

  # Justificación:
  # La exportación/importación JSON de replay YA EXISTE
  # (src/engine/registro.js: exportarRegistro / reproducirPartida, cableada
  # en App.jsx). Lo que falta es:
  #   1) copiar el replay al portapapeles con confirmación visual,
  #   2) reproducir la partida paso a paso con animación, en vez de saltar
  #      directo al estado final.
  # Los escenarios "Exportar una partida", "Importar replay" y
  # "Replay reproducible" ya están cubiertos y son de VERIFICACIÓN.

  @should @ui-02
  Escenario: Copiar replay al portapapeles
    Dado que existe un replay válido
    Cuando el usuario selecciona "Copiar Replay"
    Entonces el replay debe copiarse al portapapeles
    Y debe existir una confirmación visual de la copia

  @should @ui-02
  Escenario: Reproducir la partida paso a paso
    Dado que el usuario importa un replay válido
    Cuando inicia la reproducción
    Entonces el sistema debe ejecutar la secuencia de intenciones paso a paso
    Y debe animar los movimientos y combates entre pasos
    Y el estado final debe ser idéntico a reproducirPartida(semilla, secuencia)

  @must @ui-02
  Escenario: Exportar una partida (verificar que sigue funcionando)
    Dado que existe una partida finalizada
    Cuando el usuario selecciona "Exportar Replay"
    Entonces el sistema genera el JSON { semilla, reglas, secuencia }
    Y el JSON es reproducible con el mismo motor

  @must @ui-02
  Escenario: Importar replay (verificar que sigue funcionando)
    Dado que el usuario dispone de un replay válido
    Cuando lo importa
    Entonces el sistema reconstruye la partida con el mismo motor de reglas

  @must @ui-02
  Escenario: Replay reproducible
    Dado un replay exportado
    Cuando se reproduce nuevamente
    Entonces el resultado debe ser idéntico al resultado original


@epica-11 @ui @ui-02
Característica: US-103 — Panel de telemetría de playtest

  Como desarrollador
  quiero ver métricas agregadas de las simulaciones
  para detectar rápidamente problemas de balance.

  # Justificación:
  # La interfaz puede convertirse en una herramienta de diseño.
  #
  # REUTILIZAR: metricasDePartida() (src/engine/metrics.js) y las métricas
  # de sim/metricas.js. El panel agrega resultados de N partidas y los
  # presenta. No reimplementar métricas que ya existen.

  @must @ui-02
  Escenario: Mostrar resumen de una simulación
    Dado que finalizó una serie de partidas
    Entonces el panel debe mostrar cantidad de partidas
    Y victorias por facción
    Y promedio de rondas
    Y cantidad media de unidades eliminadas

  @should @ui-02
  Escenario: Comparar Fuego y Agua
    Dado que existen resultados de ambas facciones
    Entonces el panel debe permitir comparar sus resultados
    Y debe mostrar claramente qué facción ganó más partidas

  @should @ui-02
  Escenario: Identificar resultados extremos
    Dado que existen múltiples simulaciones
    Entonces el panel debería destacar diferencias extremas de win rate
    Y debe facilitar la identificación de posibles problemas de balance

  @must @ui-02
  Escenario: Mantener la telemetría separada del juego
    Dado que el jugador está ejecutando una partida normal
    Entonces las métricas de simulación no deben alterar el HUD principal
    Y el panel debe funcionar como herramienta de desarrollo/playtest


# =====================================================================
# US FUTURAS — NO IMPLEMENTAR TODAVÍA
# =====================================================================

@epica-11 @ui @ui-03
Característica: UI-03 — Visualización de nuevas reglas de combate (futura)

  # Justificación:
  # Algunas ideas de documentos de diseño todavía no están consolidadas
  # como reglas del MVP. La UI debe quedar preparada para consumir eventos
  # futuros, pero no debe inventar mecánicas que el motor no implementa.

  @wont @ui-03
  Escenario: Consumir un evento de crítico futuro
    Dado que una futura versión del motor emite un evento "critical"
    Cuando la interfaz recibe dicho evento
    Entonces debe poder mostrar feedback visual específico de crítico
    Y debe evitar duplicar la lógica que determina si existe crítico

  @wont @ui-03
  Escenario: Consumir futuros efectos de combate
    Dado que el motor emite un evento de combate reconocido
    Entonces la UI debe poder traducirlo a feedback visual
    Y no debe determinar por sí misma el resultado del combate


# =====================================================================
# ORDEN DE IMPLEMENTACIÓN
# =====================================================================

@epica-11 @ui @ui-02
Característica: UI-02 — Orden de implementación

  # Escenarios de proceso (no de comportamiento): definen el orden de las
  # US anteriores. Primero feedback táctico, después presentación física,
  # después herramientas de playtest.

  @ui-02
  Escenario: Implementar primero feedback táctico
    Dado que el motor y layout ya están estabilizados
    Entonces deben implementarse primero:
      """
      1. Indicadores flotantes de combate (US-095)
      2. Animación de movimiento (US-093)
      3. Indicador de coste de próxima acción junto a la unidad (US-097)
      4. Menú contextual de unidad (US-092)
      5. Zonas de amenaza (US-094)
      """

  @ui-02
  Escenario: Implementar después presentación física
    Dado que el feedback táctico ya funciona
    Entonces deben implementarse:
      """
      6. Fanout de cartas (US-096)
      7. Hover/elevación de cartas (US-096)
      8. Efectos de sonido (US-100)
      """

  @ui-02
  Escenario: Implementar después herramientas de playtest
    Dado que la experiencia de juego es estable
    Entonces deben implementarse:
      """
      9. Panel de simulación Bot vs Bot (US-101)
      10. Panel de telemetría (US-103)
      11. Replay: copiar al portapapeles y reproducción animada (US-102)
      """

  @ui-02
  Escenario: No implementar reglas pendientes como UI falsa
    Dado que una funcionalidad depende de una regla todavía no decidida
    Entonces la interfaz no debe simular dicha regla
    Y debe esperar a que el motor exponga el estado o evento correspondiente
