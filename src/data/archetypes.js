export const ROLES = { Mago: 'Mago', Guerrero: 'Guerrero' }

export const ARQUETIPOS = {
  Peon: {
    nombre: 'Peón',
    rol: ROLES.Guerrero,
    movimiento: 3,
    ataque: { dados: 1, kept: 1 },
    defensa: { dados: 1, kept: 1 },
    vida: 2,
    rango: 1,
    foco: 1,
    tecnicas: [],
  },
  Alfil: {
    nombre: 'Alfil',
    rol: ROLES.Mago,
    movimiento: 4,
    ataque: { dados: 2, kept: 1 },
    defensa: { dados: 1, kept: 1 },
    vida: 2,
    // A-11-N2 (05/08/2026): rango 3 -> 2. Agua ganaba 81-95% por tener la única
    // pieza de alcance 3 + el único Keep 2 ofensivo. Se baja el Alfil para
    // acercar el rango de Agua al resto de la mesa.
    rango: 2,
    foco: 2,
    tecnicas: [],
  },
  Torre: {
    nombre: 'Torre',
    rol: ROLES.Mago,
    movimiento: 2,
    ataque: { dados: 2, kept: 1 },
    defensa: { dados: 2, kept: 1 },
    vida: 4,
    rango: 1,
    foco: 1,
    tecnicas: [],
  },
  Caballo: {
    nombre: 'Caballo',
    rol: ROLES.Guerrero,
    movimiento: 5,
    ataque: { dados: 2, kept: 1 },
    defensa: { dados: 1, kept: 1 },
    vida: 3,
    // A-11-N2 (05/08/2026): rango 1 -> 3. Fuego no tenía pieza de alcance
    // frente al Alfil (rango 3) de Agua; se le da una pieza de proyección.
    rango: 3,
    foco: 1,
    tecnicas: [],
  },
  Campeon: {
    nombre: 'Campeón',
    rol: ROLES.Mago,
    movimiento: 4,
    ataque: { dados: 2, kept: 2 },
    defensa: { dados: 2, kept: 1 },
    vida: 4,
    rango: 2,
    foco: 3,
    tecnicas: [],
  },
  Rey: {
    nombre: 'Rey',
    rol: ROLES.Guerrero,
    movimiento: 3,
    ataque: { dados: 1, kept: 1 },
    defensa: { dados: 2, kept: 2 },
    vida: 4,
    rango: 1,
    foco: 2,
    tecnicas: [],
  },
}

export function obtenerArquetipo(nombre) {
  return ARQUETIPOS[nombre] || null
}

export function listarArquetipos() {
  return Object.keys(ARQUETIPOS)
}
