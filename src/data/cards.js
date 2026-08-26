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
// (rol/arquetipo), efecto mecánico y magnitud FIJA (el valor solo cuenta para
// el PO de Orden). El efecto se resuelve en el motor (habilidades.js), nunca
// hardcodeado en src/ui.
//
// objetivo: 'aliado' | 'enemigo' | 'cualquiera'
// filtro:   { rol?: 'Mago'|'Guerrero', arquetipos?: [nombre...] } | null
// efecto:   clave que despacha el motor (ver habilidades.js)
export const HABILIDADES_POR_CARTA = {
  Fuego1: {
    nombre: 'Chispa',
    objetivo: 'enemigo',
    filtro: null,
    efecto: 'herida',
    magnitud: 1,
    descripcion: 'Inflige 1 herida directa a un enemigo a rango.',
  },
  Fuego2: {
    nombre: 'Látigo',
    objetivo: 'enemigo',
    filtro: null,
    efecto: 'herida-retroceso',
    magnitud: 1,
    descripcion: 'Inflige 1 herida a un enemigo y lo empuja 1 hex.',
  },
  Fuego3: {
    nombre: 'Bomba',
    objetivo: 'enemigo',
    filtro: null,
    efecto: 'aoe-herida',
    magnitud: 1,
    descripcion: 'Inflige 1 herida al enemigo y a cada enemigo adyacente a él.',
  },
  Agua1: {
    nombre: 'Escarcha',
    objetivo: 'enemigo',
    filtro: null,
    efecto: 'stunned',
    magnitud: 0,
    descripcion: 'El enemigo objetivo queda Stunned.',
  },
  Agua2: {
    nombre: 'Ola',
    objetivo: 'aliado',
    filtro: null,
    efecto: 'cura',
    magnitud: 2,
    descripcion: 'Cura 2 heridas a un aliado sin superar su vida máxima.',
  },
  Agua3: {
    nombre: 'Escudo',
    objetivo: 'aliado',
    filtro: { arquetipos: ['Torre'] },
    efecto: 'muro',
    magnitud: 0,
    descripcion: 'Otorga Muro defensivo (keep +1) a una Torre aliada.',
  },
  Aire1: {
    nombre: 'Vendaval',
    objetivo: 'aliado',
    filtro: null,
    efecto: 'pool-ataque',
    magnitud: 1,
    descripcion: 'El aliado suma +1 dado a su próxima tirada de ataque.',
  },
  Aire2: {
    nombre: 'Brisa',
    objetivo: 'aliado',
    filtro: null,
    efecto: 'pool-defensa',
    magnitud: 1,
    descripcion: 'El aliado suma +1 dado a su próxima tirada de defensa.',
  },
  Aire3: {
    nombre: 'Corriente',
    objetivo: 'aliado',
    filtro: null,
    efecto: 'recuperar-carta',
    magnitud: 0,
    descripcion: 'Recuperas a la mano la carta anterior a esta en tu descarte.',
  },
  Tierra1: {
    nombre: 'Raíz',
    objetivo: 'aliado',
    filtro: null,
    efecto: 'foco',
    magnitud: 1,
    descripcion: 'El aliado guarda 1 token de Foco gratis (tope respetado).',
  },
  Tierra2: {
    nombre: 'Terremoto',
    objetivo: 'enemigo',
    filtro: null,
    efecto: 'retroceso',
    magnitud: 2,
    descripcion: 'Empuja a un enemigo 2 hexes.',
  },
  Tierra3: {
    nombre: 'Avalancha',
    objetivo: 'aliado',
    filtro: { rol: 'Guerrero' },
    efecto: 'movimiento-gratis',
    magnitud: 0,
    descripcion: 'Un Guerrero aliado puede Mover gratis este turno (solo mover).',
  },
  Vacio1: {
    nombre: 'Drenar',
    objetivo: 'enemigo',
    filtro: null,
    efecto: 'drenar-foco',
    magnitud: 1,
    descripcion: 'El enemigo pierde 1 token de Foco.',
  },
  Vacio2: {
    nombre: 'Purga',
    objetivo: 'aliado',
    filtro: null,
    efecto: 'anti-stunned',
    magnitud: 0,
    descripcion: 'Quita Stunned a un aliado.',
  },
  Vacio3: {
    nombre: 'Ruptura',
    objetivo: 'enemigo',
    filtro: null,
    efecto: 'disipar',
    magnitud: 0,
    descripcion: 'Anula el Muro del enemigo o reduce 1 dado guardado de su próxima defensa.',
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
