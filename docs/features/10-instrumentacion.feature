# language: es
@epica-10 @playtest
Característica: US-090 — Registro y reproducibilidad de la partida

  Como diseñador en playtest
  quiero poder reproducir y exportar una partida
  para discutir sobre datos y no sobre recuerdos.

  Deriva de las 5 preguntas del playtest (Alcance §6) y de los watch points (§8).

  @should
  Escenario: La semilla es visible y editable
    Cuando abro una partida nueva
    Entonces veo la semilla utilizada
    Y puedo escribir una semilla propia antes de empezar

  @should
  Escenario: Reproducir una partida
    Dado una partida guardada con su semilla y su lista de intenciones
    Cuando la cargo
    Entonces se reproduce paso a paso con resultados idénticos

  @should
  Escenario: Exportar el registro
    Dado una partida terminada
    Cuando exporto el registro
    Entonces obtengo un archivo con ronda, turno, carta jugada, PO generados,
      PO perdidos, acciones por unidad, tiradas completas y resultado

  @could
  Escenario: Métricas de los watch points
    Cuando termina la partida
    Entonces el resumen muestra cuántos PO se perdieron sin gastar,
      cuántas veces se pagó una 3ª o 4ª acción,
      cuántos turnos se jugaron en solitario al final de cada ronda,
      y en qué ronda murió cada Rey


@epica-10 @playtest
Característica: US-091 — Panel de reglas en testing

  Como diseñador
  quiero conmutar las reglas marcadas como propuestas
  para comparar variantes sin recompilar ni tocar el motor.

  Cubre FR-024, FR-025, FR-073, FR-080 y todas las decisiones D-01 a D-12.

  @should
  Escenario: El panel expone las reglas conmutables
    Cuando abro el panel de ajustes
    Entonces puedo cambiar la persistencia de tokens de Foco entre rondas
    Y puedo cambiar si Concentrarse incrementa el contador de acciones
    Y puedo cambiar el efecto de Stunned entre "−1 dado" y "−1 dado guardado"
    Y puedo cambiar si el contador de acciones se reinicia por turno o por ronda
    Y puedo cambiar el tamaño de mano inicial y el robo por turno

  @should
  Escenario: Cambiar una regla no rompe la partida en curso
    Dado una partida en la ronda 2
    Cuando cambio una regla desde el panel
    Entonces la regla se aplica desde ese momento
    Y el log registra el cambio con la ronda y el turno

  @should
  Escenario: La configuración forma parte del registro exportado
    Cuando exporto el registro de una partida
    Entonces incluye la configuración de reglas utilizada

  # Aprobado 04/08/2026 (D-23): flag `stunnedReduceKept`, implementado en src/engine/status.js.
  @should
  Escenario: Conmutar Stunned a "−1 dado guardado"
    Dado la regla de Stunned en modo "−1 dado"
    Cuando cambio la regla al modo "−1 dado guardado"
    Entonces una unidad Stunned conserva todos sus dados
    Y guarda un dado menos en su próxima tirada
    Y nunca guarda menos de 1 dado
