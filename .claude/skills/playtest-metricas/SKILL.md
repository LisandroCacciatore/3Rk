---
name: playtest-metricas
description: Cómo simular partidas del Motor de Escaramuza en lote, qué métricas extraer del registro y cómo responder con datos las 5 preguntas del playtest y los 6 watch points de balance (dominancia del Keep 2, curva 1/3/5/9, ritmo del Foco, asimetría de tempo, muerte anticlimática del Rey, dureza de Stunned). Usar para análisis de balance, simulaciones Monte Carlo y propuestas de ajuste de valores.
---

# Métricas de playtest

## Para qué existe esto

El MVP se construyó para contestar cinco preguntas de diseño. La simulación no las contesta sola
—divertido no se mide con un script— pero sí descarta hipótesis rápido y evita discutir de memoria.

## Cómo simular

El motor es determinista y sin dependencias de UI, así que se puede correr desde Node:

```js
import { crearPartida, aplicarIntencion } from '../src/engine/index.js';
```

Una simulación necesita una política de juego (un bot). Empezar con el bot más tonto posible:

1. **Aleatorio legal** — elige al azar entre las intenciones legales. Es la línea de base.
2. **Codicioso** — ataca si tiene objetivo válido, si no se acerca al enemigo más cercano.
3. **Ahorrador** — retiene cartas para el final de la ronda, para medir la asimetría de tempo.

Correr al menos 500 partidas por configuración, con semillas distintas y registradas. Enfrentar
políticas entre sí y contra sí mismas.

## Métricas mínimas por partida

- Rondas hasta el final y causa de la victoria (eliminación total o muerte del Rey).
- Ronda en la que murió cada Rey.
- PO generados, PO gastados, **PO perdidos sin gastar** por turno.
- Cuántas veces se pagó una 2ª, 3ª y 4ª acción de la misma unidad.
- Tokens de Foco generados, y cuántos llegaron a gastarse en una Técnica.
- Turnos entre que se genera el primer token y se usa la primera Técnica.
- Turnos jugados en solitario al final de cada ronda.
- Intercambios de combate: victoria del atacante, victoria del defensor, empates.
- Frecuencia de explosiones y su impacto en el resultado del intercambio.
- Heridas infligidas por arquetipo, normalizadas por cantidad de ataques.

## Los seis watch points y su métrica

| Watch point | Qué medir | Señal de alarma |
|---|---|---|
| Keep 2 domina | Tasa de victoria de intercambios de Campeón y Rey vs. el resto | Diferencia que vuelve el combate predecible |
| Curva 1/3/5/9 inerte | Porcentaje de turnos donde se paga una 3ª o 4ª acción | Cerca de cero: la curva no está haciendo nada |
| Ritmo del Foco | Turnos entre primer token y primera Técnica | Si tarda muchos turnos, el payoff llega tarde |
| Asimetría de tempo | Turnos en solitario al final de ronda y su correlación con la victoria | Correlación alta: el *hoarding* está premiado |
| Rey anticlimático | Distribución de la ronda en que muere el Rey | Muertes muy tempranas y frecuentes |
| Stunned | Tasa de victoria de una unidad Stunned en su siguiente tirada | Castigo despreciable o demoledor |

## Cómo presentar hallazgos

1. Qué se midió, con cuántas partidas y con qué configuración de reglas.
2. El número, con su dispersión, no solo el promedio.
3. Qué watch point toca y en qué dirección.
4. Una propuesta de ajuste concreta, con el cambio de valor exacto.
5. **Qué NO prueba el dato.** Una simulación con bots tontos no dice si el juego es divertido, ni
   si las decisiones son interesantes, ni si las unidades se sienten distintas: eso lo contestan
   jugadores humanos. Decirlo explícitamente en cada reporte.

## Límite de este rol

Proponer cambios de valores, nunca aplicarlos por cuenta propia. Cambiar un valor de arranque es
una decisión de diseño del dueño del proyecto, no del análisis. El trabajo termina en la
recomendación fundamentada.
