---
name: ui-tablero-hex
description: Convenciones de interfaz del prototipo — tablero hexagonal en SVG, componentes React, layout de la pantalla de partida, paleta elemental, marcadores de heridas, Foco y estados, y qué información debe estar siempre visible durante un playtest. Usar al crear o modificar cualquier archivo de src/ui.
---

# Interfaz del prototipo

## Qué es esta UI

Una herramienta de playtest, no un producto. Prioridad: **legibilidad del estado del juego**.
Toda la información que un jugador necesitaría en la mesa física tiene que estar visible sin
hacer clic.

**Fase UI-02 (a partir del 06/08/2026):** se incorporan animaciones **cortas y funcionales** y
sonido **sutil** como feedback de eventos reales del motor (movimiento, heridas, explosiones,
retroceso, Stunned, cartas). Reglas de la fase:

- Son feedback de presentación, nunca reglas: reaccionan a eventos del log/estado, no los deciden.
- Cortas y no bloqueantes: el jugador no debe esperar más de lo necesario.
- No cinematográficas: el tablero y el estado siguen siendo el protagonista.
- Sin pantallas de carga ni transiciones decorativas de página.
- Si un comportamiento visual no puede derivarse del estado del motor, **no se inventa**: se
  reporta `BLOCKED` y se sigue con la siguiente historia.

## Regla que no se negocia

Ningún componente calcula reglas. Costes, alcances, legalidad de un movimiento, resultado de un
combate: todo sale de selectores de `src/engine`. La UI solo pinta el estado y despacha
intenciones. Ver la skill `arquitectura-motor`.

## Layout de la pantalla

```
┌─────────────────────────────────────────────────┐
│ Ronda 2 · Turno de A · Mano A:3 B:1 · Semilla   │  encabezado siempre visible
├──────────────────────────┬──────────────────────┤
│                          │  Ficha de la unidad  │
│      Tablero SVG         │  seleccionada        │
│                          ├──────────────────────┤
│                          │  Registro de partida │
├──────────────────────────┴──────────────────────┤
│ PO disponibles · Mano · Acciones · Fin de turno │
└─────────────────────────────────────────────────┘
```

## Tablero

- Un `<svg>` con `viewBox` calculado a partir del radio del tablero, y un `<polygon>` por hexágono.
- El click va en el `<polygon>`; no hace falta hit-testing manual.
- Conversión a píxeles y vértices: skill `geometria-hex`.
- Capas, en orden de dibujado: terreno → resaltados → unidades → marcadores → overlay de LoS.

Estados visuales del hexágono: normal, bloqueado, alcanzable (movimiento), objetivo válido
(ataque), seleccionado. Se distinguen por relleno y borde, nunca solo por color: en las capturas
de playtest se pierde el matiz.

## Unidades y marcadores

Cada miniatura muestra sin hacer clic:

- Arquetipo (inicial o glifo) y jugador (color de banda).
- Heridas: puntos llenos sobre el total de Vida.
- Foco: casilleros, llenos con el símbolo del elemento guardado, vacíos si quedan libres.
- Estados: marcador de Stunned, marcador de Muro activo.
- Activación cerrada tras atacar: la miniatura se atenúa.

## Paleta elemental

| Elemento | Uso |
|---|---|
| 🔥 Fuego | rojo cálido |
| 💧 Agua | azul |
| 🌪️ Aire | celeste claro |
| 🌍 Tierra | verde tierra |
| ◼️ Vacío | violeta oscuro |

El elemento se identifica siempre por **símbolo + color**, nunca solo por color.

## Menú de acciones

Muestra las cuatro acciones básicas con su **coste actual** en PO, calculado por el motor. Las
que no se pueden pagar o no son legales aparecen deshabilitadas **con el motivo** ("sin línea de
visión", "ya atacó este turno", "PO insuficientes"). El motivo es información de playtest: si el
jugador no entiende por qué no puede hacer algo, esa es una respuesta a la pregunta 1 del playtest.

## Registro

Panel con scroll, entrada por evento, la más reciente abajo. Cada combate muestra pool tirado,
dados obtenidos, guardados, explosiones destacadas, las dos sumas y el resultado. Es la evidencia
para discutir si el Roll and Keep se siente justo.

## Confirmaciones

Solo dos: terminar el turno con PO sin gastar, y declarar un ataque. Nada más pide confirmación;
un prototipo con diálogos por todos lados no se puede jugar rápido.

## Lo que no se hace en este ciclo

- **Reglas nuevas desde la UI:** ningún componente decide resultados, costes ni estados. Todo
  sale de `src/engine`. Una animación o indicador que depende de una regla todavía no implementada
  espera al motor (o se marca `BLOCKED`), no la simula.
- **Componentes nuevos de gran superficie:** responsive completo, accesibilidad total, arrastrar
  y soltar, temas. Si algo de esto aparece pedido, preguntar antes de construirlo.
- **Falsas mecánicas:** nada de "Crítico a 7+", "Agotado" ni ningún estado/evento que el motor no
  emita. La UI consume `estado` y `log`; no infiere reglas.

Sí está en alcance desde UI-02: menú contextual junto a la unidad, animación de movimiento,
indicadores flotantes de combate, zonas de amenaza, abanico de cartas, coste de próxima acción,
sonido ligero y paneles de simulación/telemetría (estos reutilizan `sim/bots.js` y
`src/engine/metrics.js`, no escriben bots nuevos).
