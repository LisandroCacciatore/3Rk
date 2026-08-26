# Inventario de Producción — Motor de Escaramuza

Inventario cerrado y listo para producir, traducido 1:1 de la realidad actual del prototipo.
**Fuente de verdad:** `src/` (motor + datos). Toda cifra acá debe poder recalcularse desde el
código; el test `src/tests/inventario-produccion.spec.js` la verifica y falla si se desincronizan.
Nada que no exista en el código se inventa acá: los valores 🟡 son decisiones de **producción**
(años de cantidades físicas), no reglas de juego.

Versión del inventario: 12/08/2026 (revisión D-37/D-38: 12 miniaturas, 4 facciones, 60 cartas).
Estado del motor: 405/405 tests en verde.

---

## 1. Producción de Unidades (Roster de Combate)

### 1.1 Ficha Técnica de Arquetipos (6 clases oficiales)

Stats exactas de `src/data/archetypes.js`. Las RANGOS corregidas por A-11-N2 (05/08/2026):
Alfil **2** (antes 3), Caballo **3** (antes 1), Campeón **2** (antes "1–2").

| Arquetipo | Rol Táctico | Mov | Ataque | Defensa | Vida | Rango | Foco | En mesa (típica) |
|---|---|---|---|---|---|---|---|---|
| Peón | Infantería básica / melee sacrificable | 3 | 1g1 | 1g1 | 2 | 1 | 1 | 2 (1 por bando) |
| Alfil | Tirador a distancia / escaramuza | 4 | 2g1 | 1g1 | 2 | **2** | 2 | 2 (1 por bando) |
| Torre | Tanque defensivo / lento | 2 | 2g1 | 2g1 | 4 | 1 | 1 | 2 (1 por bando) |
| Caballo | Flanqueador móvil | 5 | 2g1 | 1g1 | 3 | **3** | 1 | 2 (1 por bando) |
| Campeón | Élite / portador de técnicas | 4 | 2g2 | 2g1 | 4 | **2** | 3 | 2 (1 por bando) |
| Rey | Líder / condición de victoria | 3 | 1g1 | 2g2 | 4 | 1 | 2 | 2 (1 por bando) |

Notación `XgY` = tirar X dados, guardar Y (D10 Roll & Keep).

### 1.2 Regla de balance de Keep (FR-062)

El Keep 2 está reservado exclusivamente para el **Campeón** (Ataque 2g2) y el **Rey**
(Defensa 2g2). Ninguna unidad estándar guarda 2 dados. Es una restricción de diseño
(en el código es una propiedad de los perfiles, no un flag).

### 1.3 Set de mesa por partida

Despliegue **simétrico estilo ajedrez** (D-38, fijo) en `src/engine/state.js`. Cada bando monta
**los 6 arquetipos exactamente una vez** → **12 unidades en mesa**:

| Bando | Roster completo (D-38) |
|---|---|
| A | Rey · Campeón · Alfil · Torre · Caballo · Peón |
| B | Rey · Campeón · Alfil · Torre · Caballo · Peón |

La diferenciación entre facciones **no está en la plantilla** (ambos bandos field los 6 arquetipos)
sino en las **4 habilidades activas del mazo base de cada facción** (D-37, sección 3).

### 1.4 Cantidad de miniaturas por caja

Con 12 en mesa (una de cada arquetipo por bando), la caja lleva **pares de cada arquetipo**:

| Arquetipo | Por caja |
|---|---|
| Peón | 2 |
| Alfil | 2 |
| Torre | 2 |
| Caballo | 2 |
| Campeón | 2 |
| Rey | 2 |
| **Total** | **12** |

No hay excedente: cada ejemplar se usa una vez por partida (2 de cada = 1 por bando). Un set mínimo
de 10 solo tendría sentido con el despliegue 5+5 anterior; con D-38 el mínimo es 12.

---

## 2. Producción del Tablero y Terrenos

### 2.1 Especificación del tablero

| | Valor |
|---|---|
| Formato | Grilla rectangular de hexágonos, offset odd-r |
| Estándar de escenario | **15×10 (150 casillas)** |
| Excepción oficial | Río Tajii 13×9 (117 casillas) — escenario de victoria por estandartes |

El motor maneja las colisiones con dos set por escenario (`src/data/scenarios.js` →
`cargarEscenario`):

- `tablero.bloqueados`: **impasable + sin LoS** (bosque, montaña, lugares capturados).
- `tablero.bloqueaMovimientoSinLos`: **impasable al paso, LoS abierta** (agua, D-28;
  el flag conmutable `aguaBloqueaLoS` la rebloquea si se activa).

> El agua **no** se suma a `bloqueados`: los arqueros disparan a través del río. Esto es
> una diferencia deliberada respecto a bosque/montaña.

### 2.2 Catálogo oficial de biomas (7 tiles, prado = tapete)

| Símbolo | Visual | Paso | LoS | Reglas motor |
|---|---|---|---|---|
| 🟩 | Pradera | Libre | — | Terreno base, 0 coste (`reglasTerreno` no la lista) |
| 🌲 | Bosque | Bloqueado | Bloquea | `bloqueados` |
| ⛰️ | Montaña | Bloqueado | Bloquea | `bloqueados` |
| 🌊 | Agua | Impasable al paso | **Abierta** | `bloqueaMovimientoSinLos` (D-28) |
| 🌉 | Vado | Libre | — | Cruce libre sobre agua (igual que prado) |
| 🌁 | Puente | Libre | — | `reglasTerreno.puente`: coste 0 / mod 0 (D-30) |
| 🪵 | Empalizada | Libre (+1 mov) | Abierta | `reglasTerreno.empalizada`: +1 mov, −1 dado (D-31) |

Fuente: `SIMBOLO_TERRENO` en `src/data/scenarios.js` y `reglasTerreno` en `src/data/rules.js`.

### 2.3 Kit de tiles del prototipo físico (tapete pradera 15×10 + tiles)

Cantidad por tile = **máximo por símbolo sobre los 6 escenarios con matriz** (suficiente
para montar cualquiera de ellos, uno a la vez). Conteos derivados de las matrices de
`src/data/scenarios.js`.

| Tile | Kit |
|---|---|
| 🌲 Bosque Denso | **48** |
| ⛰️ Montaña | **28** |
| 🌊 Agua Profunda | **31** |
| 🌉 Vado | **2** |
| 🌁 Puente | **1** |
| 🪵 Empalizada | **2** |
| 🟩 Tapete de Pradera (base) | 1 (15×10) |
| **Total tiles** | **112** |

Conteo por escenario (referencia; para armar un mapa fijo alcanza con sus propios números):

| Escenario | Dim | 🌲 | ⛰️ | 🌊 | 🌉 | 🌁 | 🪵 |
|---|---|---|---|---|---|---|---|
| El Valle de los Dos Vados | 15×10 | 17 | 0 | 31 | 2 | 0 | 0 |
| La Garganta del Dragón | 15×10 | 28 | 28 | 0 | 0 | 0 | 0 |
| La Encrucijada de los Tres Carriles | 15×10 | 48 | 0 | 0 | 0 | 0 | 0 |
| Las Ruinas del Bastión | 15×10 | 12 | 16 | 0 | 0 | 0 | 0 |
| Los Humedales del Sur | 15×10 | 17 | 0 | 28 | 0 | 0 | 0 |
| Río Tajii | 13×9 | 6 | 0 | 4 | 2 | 1 | 2 |

---

## 3. Producción de Cartas y Mazos

### 3.1 Reparto oficial del mazo base (15 cartas por facción)

Catálogo `HABILIDADES_POR_CARTA` en `src/data/cards.js`. Las **4 facciones** comparten la misma
estructura de mazo (5 elementos × 3 valores de Orden 1–3, 7 Hechizo / 8 Arma), pero cada una
declara **4 habilidades activas** distintas (D-37, `FACciones[].habilidadesActivas` en
`src/data/factions.js`):

| Faccion | Habilidades activas (4 de sus 15 cartas) |
|---|---|
| 🔥 Fuego | Fuego1 Chispa · Fuego3 Bomba · Vacio3 Ruptura · Aire1 Vendaval |
| 💧 Agua | Agua1 Escarcha · Agua3 Escudo · Vacio2 Purga · Tierra1 Raíz |
| 🌪️ Aire | Aire2 Brisa · Aire3 Corriente · Vacio1 Drenar · Agua2 Ola |
| 🌍 Tierra | Tierra2 Terremoto · Tierra3 Avalancha · Vacio1 Drenar · Fuego2 Látigo |

Las 15 cartas del catálogo (nombre por elemento × valor):

| 🔥 Fuego | 💧 Agua | 🌪️ Aire | 🌍 Tierra | ◼️ Vacío |
|---|---|---|---|---|
| 1 Chispa | 1 Escarcha | 1 Vendaval | 1 Raíz | 1 Drenar |
| 2 Látigo | 2 Ola | 2 Brisa | 2 Terremoto | 2 Purga |
| 3 Bomba | 3 Escudo | 3 Corriente | 3 Avalancha | 3 Ruptura |

### 3.2 Cantidad por caja

- Mazo por facción: **15 cartas** (Fuego, Agua, Aire, Tierra).
- **Total por caja: 60 cartas** (4 mazos, formato 63 × 88 mm).

---

## 4. Componentes Auxiliares e Interfaz (Tokens / UI)

| Componente | Cantidad | Nota |
|---|---|---|
| 🟡 Tokens de Foco por elemento (🔥💧🌪️🌍◼️) | **20** × 5 = 100 | El máximo simultáneo de ambos bandos es 15 (Agua 9 + Fuego 6). El arranque propuesto era 10/elemento: insuficiente si ambos bandos se llenan a la vez. 🟡 decisión de producción |
| Marcadores de Stunned | 8 | Cobertura: 12 unidades máximo en mesa |
| Marcadores de Herida / Vida | 🟡 **más de 12** | Máximo simultáneo teórico ≈ 35 (3–4 heridas × 12 unidades). Alternativa recomendada: llevar la vida con un D6 por unidad. 🟡 decisión de producción |
| Dados D10 | **8** | Pool típico pico ≈ 4 ataque + 3 defensa (cartas/técnicas) + re-tiradas |
| Moneda / token de inicio | 1 | Decide el jugador inicial (D-11 / ronda) |

---

## 5. Modelo de datos → código (mapeo)

Los datos fuente del inventario viven en los archivos reales del proyecto:

| Inventario | Archivo fuente |
|---|---|
| Personajes de arquetipos (6) | `src/data/archetypes.js` |
| Catálogo de 15 cartas (`HABILIDADES_POR_CARTA`, `TIPO_DE_CARTA`) | `src/data/cards.js` |
| Facciones, habilidades activas y mazos | `src/data/factions.js` |
| Matrices de los 6 escenarios + `SIMBOLO_TERRENO` | `src/data/scenarios.js` |
| Reglas de terreno por tile (`reglasTerreno`) y flags 🟡 | `src/data/rules.js` |
| Despliegue simétrico 6+6 (D-38) | `src/engine/state.js`, `scenarios.js` |
| Regla Keep 2 (FR-062) | reflejo en `src/data/archetypes.js` |

> **Verificación anti-deriva:** `src/tests/inventario-produccion.spec.js` recalcula
> despliegues, stats, reparto de cartas y conteos de tiles desde el código y los compara
> contra las tablas de este documento. Si se cambia un arquetipo, un escenario o el mazo,
> el test falla hasta actualizar el inventario.

---

## Decisiones de producción pendientes (no bloquean el inventario)

1. **Tokens de Foco**: ¿20 por elemento (recomendado, cubre el máximo simultáneo) o 10 por
   elemento (más barato, riesgo de quedarse cortos a alto Foco)? → elegido provisionalmente **20**.
2. **Marcadores de herida**: ¿33 (cobertura total) o contador D6 por unidad? El arranque de 12
   es insuficiente para el máximo simultáneo. → recomendación: **D6 por unidad**, o 33 fichas.
3. **Set de miniaturas**: con el despliegue 6+6 (D-38, firme) el mínimo es **12** = pares de los
   6 arquetipos (1 por bando). → **cerrado**.