# language: es

# =====================================================================
# ESCARAMUZA — ÉPICA 18: FACCIÓN = 4 HABILIDADES ACTIVAS (US-170)
# Asimetría de facción por habilidades del mazo base
# Fecha: 12/08/2026 — decisión D-37 (firme)
#
# ESTADO DE BASE (verificado 12/08/2026)
# - Implementado en src/data/factions.js (FACcIONES con `habilidadesActivas`
#   y `generarMazoFaccion`) y src/data/cards.js (HABILIDADES_POR_CARTA).
# - D-27 (cerrado): la habilidad es de la CARTA; cualquier unidad aliada en
#   rango/LoS del objetivo puede canalizarla. No hay gate por rol.
# - D-37 (nuevo, aprobado 12/08/2026): la asimetría de facción vive en las
#   HABILIDADES ACTIVAS del mazo base: cada facción declara 4 cartas (de sus
#   15) cuya habilidad nace activa; el resto de cartas no declara habilidad.
# - Fuente de verdad de los invariantes: src/tests/facciones-habilidades.spec.js.
# =====================================================================

@epica-18 @facciones @cartas @asimetria
Característica: US-170 — Cada facción tiene 4 habilidades activas en su mazo base

  Como jugador
  quiero que cada facción declare qué 4 habilidades de sus 15 cartas nacen activas
  para que la asimetría de bandas viva en el mazo y no en la plantilla de unidades.

  # Justificación:
  # Con el despliegue simétrico 6+6 (US-171, D-38) ambos bandos field los mismos
  # 6 arquetipos; la diferenciación entre facciones pasa a las cartas. D-37 fija
  # el reparto: 4 habilidades activas por facción sobre las 15 cartas base.
  # Es un dato (factions.js), no una regla en el motor.

  Contexto:
    Dado el catálogo de 4 facciones (Fuego, Agua, Tierra y Aire) en FACcIONES

  @must @FR-063
  Escenario: Cada facción declara exactamente 4 habilidades activas sobre su mazo de 15
    Dado el mazo base de una facción
    Entonces el mazo tiene 15 cartas (1 por elemento × valor de Orden)
    Y exactamente 4 de ellas declaran habilidad activa
    Y las 4 habilidades declaradas existen en el catálogo HABILIDADES_POR_CARTA

  @must @FR-063
  Escenario: Las cuatro facciones se diferencian por sus habilidades activas
    Dado el conjunto de habilidades activas de cada facción
    Entonces cada facción tiene un conjunto propio, distinto de las demás
    Y ninguna otra facción comparte la misma combinación de 4 habilidades

  @must @FR-063
  Escenario: Una carta del mazo nace con habilidad o sin ella según lo declara su facción
    Dado que la facción declara a "Fuego3" como habilidad activa
    Cuando se genera el mazo de esa facción
    Entonces la carta Fuego3 nace con su habilidad "Bomba" asignada
    Y toda carta NO declarada nace sin habilidad

  @must @FR-063
  Escenario: La versión de prueba mantiene mazos simétricos en estructura pero NO en habilidades
    Dado los mazos base de Fuego y de Agua
    Entonces ambos tienen el mismo reparto de valores de Orden (1–3 por elemento)
    Y el conjunto de habilidades activas de Fuego difiere del de Agua