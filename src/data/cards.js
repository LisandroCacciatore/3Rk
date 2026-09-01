import { ARQUETIPOS } from './archetypes.js'

// D-24 (US-160): tipos de carta como METADATO de identidad (Arma/Hechizo).
// Ya no gaten mecánico: con D-27 la habilidad es de la carta y la puede
// canalizar cualquier unidad aliada. El mapa fijo "elemento+valor" → tipo se
// conserva para preservar el reparto 7 Hechizo / 8 Arma del mazo de 15.
export const TIPOS = { Arma: 'Arma', Hechizo: 'Hechizo' }

export const TIPO_DE_CARTA = {
  Fuego1: TIPOS.Hechizo,
  Fuego2: TIPOS.Arma,
  Fuego3: TIPOS.Arma,
  Agua1: TIPOS.Arma,
  Agua2: TIPOS.Hechizo,
  Agua3: TIPOS.Hechizo,
  Aire1: TIPOS.Hechizo,
  Aire2: TIPOS.Arma,
  Aire3: TIPOS.Arma,
  Tierra1: TIPOS.Arma,
  Tierra2: TIPOS.Arma,
  Tierra3: TIPOS.Hechizo,
  Vacio1: TIPOS.Hechizo,
  Vacio2: TIPOS.Arma,
  Vacio3: TIPOS.Hechizo,
}

export function tipoDeCarta(carta) {
  return carta && carta.tipo
}

// D-27 (US-163): catálogo de habilidades POR CARTA. Cada una de las 15 cartas
// declara su propia habilidad: nombre, objetivo (bando), filtro opcional
// (rol/arquetipo), efecto mecánico y magnitud que escala con el valor de la carta.
// El efecto se resuelve en el motor (habilidades.js), nunca hardcodeado en src/ui.
//
// seleccionDirecta: true = single-click (sin elección de origen). Solo para
//   habilidades sin filtro. El motor auto-selecciona el origen más cercano.
// magnitudBase: valor base del efecto.
// escalaConValor: 'multiplicar' = base × carta.valor | 'sumar' = base + (valor-1) | null = fijo.
// objetivo: 'aliado' | 'enemigo' | 'cualquiera'
// filtro:   { rol?: 'Mago'|'Guerrero', arquetipos?: [nombre...] } | null
// efecto:   clave que despacha el motor (ver habilidades.js)
export const HABILIDADES_POR_CARTA = {
  Fuego1: {
    nombre: 'Chispa',
    objetivo: 'enemigo',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'herida',
    magnitudBase: 1,
    escalaConValor: 'multiplicar',
    descripcion: 'Inflige 1-3 heridas directas (según valor de carta).',
  },
  Fuego2: {
    nombre: 'Látigo',
    objetivo: 'enemigo',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'herida-retroceso',
    magnitudBase: 1,
    escalaConValor: 'multiplicar',
    descripcion: 'Inflige 1-3 heridas y empuja 1 hex.',
  },
  Fuego3: {
    nombre: 'Bomba',
    objetivo: 'enemigo',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'aoe-herida',
    magnitudBase: 1,
    escalaConValor: 'multiplicar',
    descripcion: 'Inflige 1-3 heridas al objetivo y a cada adyacente.',
  },
  Agua1: {
    nombre: 'Escarcha',
    objetivo: 'enemigo',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'stunned',
    magnitudBase: 0,
    escalaConValor: null,
    descripcion: 'El enemigo objetivo queda Stunned.',
  },
  Agua2: {
    nombre: 'Ola',
    objetivo: 'aliado',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'cura',
    magnitudBase: 2,
    escalaConValor: 'sumar',
    descripcion: 'Cura 2-4 heridas a un aliado.',
  },
  Agua3: {
    nombre: 'Escudo',
    objetivo: 'aliado',
    filtro: { arquetipos: ['Torre'] },
    seleccionDirecta: false,
    efecto: 'muro',
    magnitudBase: 0,
    escalaConValor: null,
    descripcion: 'Otorga Muro defensivo (keep +1) a una Torre aliada.',
  },
  Aire1: {
    nombre: 'Vendaval',
    objetivo: 'aliado',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'pool-ataque',
    magnitudBase: 1,
    escalaConValor: 'sumar',
    descripcion: 'Aliado suma +1-3 dados a su próximo ataque.',
  },
  Aire2: {
    nombre: 'Brisa',
    objetivo: 'aliado',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'pool-defensa',
    magnitudBase: 1,
    escalaConValor: 'sumar',
    descripcion: 'Aliado suma +1-3 dados a su próxima defensa.',
  },
  Aire3: {
    nombre: 'Corriente',
    objetivo: 'aliado',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'recuperar-carta',
    magnitudBase: 0,
    escalaConValor: null,
    descripcion: 'Recuperas a la mano la carta anterior a esta en tu descarte.',
  },
  Tierra1: {
    nombre: 'Raíz',
    objetivo: 'aliado',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'foco',
    magnitudBase: 1,
    escalaConValor: 'sumar',
    descripcion: 'Aliado recibe 1-3 tokens de Foco.',
  },
  Tierra2: {
    nombre: 'Terremoto',
    objetivo: 'enemigo',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'retroceso',
    magnitudBase: 2,
    escalaConValor: 'sumar',
    descripcion: 'Empuja enemigo 2-4 hexes.',
  },
  Tierra3: {
    nombre: 'Avalancha',
    objetivo: 'aliado',
    filtro: { rol: 'Guerrero' },
    seleccionDirecta: false,
    efecto: 'movimiento-gratis',
    magnitudBase: 0,
    escalaConValor: null,
    descripcion: 'Un Guerrero aliado puede Mover gratis este turno.',
  },
  Vacio1: {
    nombre: 'Drenar',
    objetivo: 'enemigo',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'drenar-foco',
    magnitudBase: 1,
    escalaConValor: 'multiplicar',
    descripcion: 'Enemigo pierde 1-3 tokens de Foco.',
  },
  Vacio2: {
    nombre: 'Purga',
    objetivo: 'aliado',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'anti-stunned',
    magnitudBase: 0,
    escalaConValor: null,
    descripcion: 'Quita Stunned a un aliado.',
  },
  Vacio3: {
    nombre: 'Ruptura',
    objetivo: 'enemigo',
    filtro: null,
    seleccionDirecta: true,
    efecto: 'disipar',
    magnitudBase: 0,
    escalaConValor: null,
    descripcion: 'Anula el Muro del enemigo o reduce 1 dado guardado.',
  },
}

export function habilidadDeCarta(carta) {
  return carta && carta.habilidad
}

// D-27 (US-163): filtro de objetivo de una habilidad. Chequea bando (objetivo)
// y, si existe, rol y/o arquetipos de la unidad objetivo. Puro dato: lo usan el
// selector (para resaltar) y el motor (para validar).
export function cumpleFiltroObjetivo(unidad, habilidad, esAliado) {
  const objetivo = habilidad.objetivo || 'cualquiera'
  if (objetivo === 'aliado' && !esAliado) return false
  if (objetivo === 'enemigo' && esAliado) return false
  const filtro = habilidad.filtro
  if (!filtro) return true
  const rol = ARQUETIPOS[unidad.arquetipo]?.rol
  if (filtro.rol && rol !== filtro.rol) return false
  if (filtro.arquetipos && !filtro.arquetipos.includes(unidad.arquetipo)) return false
  return true
}
