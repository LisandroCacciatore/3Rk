---
name: historias-gherkin
description: Convenciones para escribir y mantener el backlog de user stories del Motor de Escaramuza en Gherkin español — estructura de Característica, tags de trazabilidad FR y MoSCoW, criterios testeables, decisiones abiertas y estado de cada historia. Usar al agregar, dividir, corregir o marcar como completada cualquier historia de docs/features.
---

# Convenciones del backlog

## Idioma y formato

Gherkin en español. Todo archivo empieza con `# language: es`.
Palabras clave: `Característica`, `Contexto`, `Escenario`, `Esquema del escenario`, `Ejemplos`,
`Dado`, `Cuando`, `Entonces`, `Y`, `Pero`.

## Anatomía de una historia

```gherkin
@epica-5 @combate
Característica: US-052 — Resolución del ataque por suma

  Como jugador
  quiero comparar la suma de mis dados guardados contra la del defensor
  para saber quién gana el intercambio.

  Cubre FR-032, FR-051.

  Contexto:
    Dado un atacante adyacente al defensor

  @must @FR-051
  Escenario: Comparación de sumas
    Dado que el ataque suma 9 y la defensa suma 4
    Cuando se resuelve el combate
    Entonces gana el ataque
```

Obligatorio en cada historia: identificador `US-0xx`, narrativa de tres líneas, línea `Cubre FR-…`,
y tags por escenario.

## Tags

- Épica: `@epica-0` a `@epica-10`, más el dominio (`@combate`, `@foco`, `@tablero`…).
- Trazabilidad: `@FR-051`, el requerimiento del Alcance Funcional que cubre el escenario.
- Prioridad MoSCoW por escenario: `@must`, `@should`, `@could`, `@wont`.

Un escenario sin `@FR-…` es sospechoso: o falta el requerimiento en el Alcance, o el escenario
está de más. Ambas cosas hay que resolverlas, no dejarlas pasar.

## Qué hace bueno a un escenario

- **Testeable.** "el combate se siente tenso" no es un criterio; "el empate resuelve idéntico a
  victoria del defensor" sí.
- **Un comportamiento por escenario.** Si el `Entonces` tiene tres verbos sin relación, son tres
  escenarios.
- **Con su caso negativo.** Por cada acción que se ejecuta hay un escenario donde se rechaza, y
  ese escenario verifica que **no** hubo efectos parciales: sin PO consumidos, sin contador
  incrementado, sin estado modificado.
- **Sin implementación adentro.** El escenario dice qué pasa, no qué función se llama.
- **Con números concretos.** "cuesta 3 PO", no "cuesta más".

## Esquema del escenario

Se usa para tablas de valores (costes, perfiles de arquetipo, resultados de comparación). No se
usa para amontonar comportamientos distintos en una tabla: eso oculta la diferencia entre casos.

## Reglas en testing

Toda regla marcada 🟡 en el GDD se documenta como decisión abierta (D-01 a D-12 en la skill
`reglas-escaramuza`) con un valor de arranque explícito, y el escenario correspondiente prueba
**ambas** variantes cuando la regla es conmutable. Nunca se congela un 🟡 en un escenario sin
avisar.

## Mantenimiento

- Al cerrar una historia se marca en `docs/BACKLOG.md`, no en el `.feature`: el archivo de
  escenarios es especificación, no tablero de tareas.
- Si durante la implementación aparece una ambigüedad, se agrega como decisión abierta con su
  valor de arranque y se avisa. No se resuelve en silencio dentro del código.
- Dividir una historia es preferible a agrandarla. Si una historia toca más de tres archivos del
  motor, probablemente son dos.
- No renumerar historias existentes: los identificadores son referencias en conversaciones y
  commits. Las nuevas se agregan al final del rango de su épica.
