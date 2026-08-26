---
name: gherkin-a-vitest
description: Cómo traducir los escenarios Gherkin de docs/features a tests Vitest del prototipo — nombres que espejan el escenario, Esquema del escenario a it.each, inyección de dados fijos, helpers de armado de estado y qué se testea contra el motor y no contra la UI. Usar al escribir, corregir o revisar cualquier archivo de src/tests.
---

# De Gherkin a Vitest

## Principio

Cada `Escenario` del backlog es **un** `it()` con el **mismo texto** como nombre. Esto permite
buscar un test desde el escenario y viceversa, y detectar de un vistazo qué historia quedó sin
cobertura. Nada de renombrar por comodidad.

```js
// docs/features/06-combate.feature → src/tests/combat.spec.js
describe('US-053 — El atacante gana: herida y eliminación', () => {
  it('Una victoria del atacante inflige una herida', () => { /* ... */ });
});
```

## Estructura de un test

`Dado` → arreglo del estado. `Cuando` → una llamada a `aplicarIntencion`. `Entonces` → asserts.

```js
const estado = armarEstado({
  unidades: [
    unidad('Peón-1', 'A', 'Peon', { q: 0, r: 0 }),
    unidad('Peón-2', 'B', 'Peon', { q: 1, r: 0 }, { heridas: 1 }),
  ],
  po: { A: [{ elemento: 'Fuego', cantidad: 3 }] },
  dados: [9, 2],                    // atacante saca 9, defensor 2
});

const nuevo = aplicarIntencion(estado, { tipo: 'ATACAR', jugador: 'A', atacante: 'Peón-1', objetivo: 'Peón-2' });

expect(buscarUnidad(nuevo, 'Peón-2')).toBeUndefined();
expect(nuevo.log.at(-1).tipo).toBe('eliminacion');
```

## Helpers obligatorios (`src/tests/helpers.js`)

- `armarEstado(parcial)` — estado mínimo válido con lo que se le pase por encima. Sin esto cada
  test arma 40 líneas de andamiaje y nadie los lee.
- `unidad(id, jugador, arquetipo, pos, extras)`
- `dadosFijos([...valores])` — RNG que devuelve esa secuencia en orden y falla si se agota. Que
  falle es deliberado: si el motor pide más dados de los esperados, el test tiene que romperse.
- `buscarUnidad(estado, id)`

## Esquema del escenario → it.each

```js
it.each([
  [0, 1], [1, 3], [2, 5], [3, 9],
])('Escala 1/3/5/9 — con %i acciones previas cuesta %i PO', (previas, coste) => {
  expect(costeProximaAccion(unidadCon({ accionesEsteTurno: previas }))).toBe(coste);
});
```

## Qué se testea dónde

| Tipo de escenario | Dónde | Cómo |
|---|---|---|
| Reglas, costes, combate, LoS, victoria | `src/tests/*.spec.js` | Contra el motor, sin React |
| "veo", "se resalta", "aparece deshabilitado" | Verificación manual en el navegador | Anotado en el reporte, no automatizado |
| Determinismo y reproducción | `src/tests/determinismo.spec.js` | Dos partidas con la misma semilla |

Los escenarios de UI del backlog están marcados con verbos de percepción ("veo", "se muestra").
No se automatizan en este ciclo: montar React Testing Library para un prototipo de playtest
cuesta más de lo que devuelve. Se verifican a mano y se deja constancia.

## Reglas de disciplina

1. **Un test que no falla primero no sirve.** Al implementar una historia, escribir el test,
   verlo fallar, y recién ahí implementar.
2. **Nada de mockear el motor.** Se mockea el RNG y nada más.
3. **Sin `Math.random()` en los tests.** Siempre `dadosFijos`.
4. **Cada escenario con tag `@must` tiene test.** Los `@should` también salvo que sean de UI.
   Los `@could` y `@wont` pueden quedar sin cobertura y se anota.
5. **Los casos negativos importan tanto como los positivos.** "no se consume PO", "el contador no
   se incrementa", "el estado devuelto es idéntico": el backlog los pide explícitamente porque los
   efectos parciales son el bug más caro de este diseño.

## Reporte al terminar

Al cerrar una historia, informar: escenarios cubiertos, escenarios verificados a mano,
escenarios sin cobertura y por qué, y si algún test anterior se rompió.
