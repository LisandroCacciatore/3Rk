export const REGLAS_POR_DEFECTO = {
  // D-01: ¿Los tokens de Foco persisten entre rondas?
  focoPersisteEntreRondas: true,

  // D-02: ¿Concentrarse consume un paso del contador 1/3/5/9?
  concentrarseConsumeContador: false,

  // D-03: ¿Cuándo se declara una Técnica?
  // 'antes-de-tirar' | 'despues-de-tirar'
  declaracionTecnica: 'antes-de-tirar',

  // D-04: ¿El coste escalonado depende de tokens ya guardados o comprados este turno?
  // 'guardados-en-reserva' | 'comprados-este-turno'
  costeEscalonadoBase: 'guardados-en-reserva',

  // D-05: ¿El contador 1/3/5/9 se reinicia por turno o por ronda?
  // 'turno' | 'ronda'
  reinicioContador: 'turno',

  // A-11-N3 (aprobado 05/08/2026): curva de costes de acción por unidad.
  // Antes 1/3/5/9 (muerta en la práctica: 5 y 9 PO = 0 en todas las configs de
  // simulación). Ahora 1/2/3/5: el 2º escalón baja a 2 PO y el 3º a 3 PO, para
  // que existan con 1 carta por turno (1-3 PO). Conmutable.
  costesAccion: [1, 2, 3, 5],

  // D-06: ¿Qué pasa si el atacante no puede retroceder?
  // 'se-queda-en-hex' | 'retroceso-forzado'
  retrocesoImposible: 'se-queda-en-hex',

  // D-07: ¿Cuál es el hex "de atrás"?
  // 'opuesto-a-direccion' | 'vecino-libre-mas-lejano'
  hexDeAtras: 'opuesto-a-direccion',

  // D-08: Tamaño de mano inicial y robo por turno.
  // Aprobado 05/08/2026: robo por turno = 0. Cada jugador gasta sus 5 cartas
  // iniciales (1 por turno) y la ronda termina cuando ambas manos quedan vacías.
  manoInicial: 5,
  roboPorTurno: 0,

  // D-09: ¿Qué pasa al terminar la ronda?
  // 'rebarajar-descarte-y-robar-mano-nueva'
  finDeRonda: 'rebarajar-descarte-y-robar-mano-nueva',

  // D-10: ¿Stunned puede bajar el pool a 0?
  // true = mínimo 1 dado siempre
  stunnedMinimoUnDado: true,

  // D-11: Despliegue inicial
  // 'posiciones-fijas-del-escenario'
  despliegue: 'posiciones-fijas-del-escenario',

  // D-12: ¿El defensor puede quedar Stunned?
  defensorNoQuedaStunned: true,

  // D-13: Umbral de explosión de los dados y tope de cadena
  explosionUmbralPorDefecto: 10,
  explosionUmbralExplosion: 9,
  explosionTopeCadena: 20,

  // D-17: el tope de cadena es el nivel de Foco del que tira (sustituye el tope fijo 20 de D-13)
  // true = un dado explotado se repite hasta `nivel de Foco` veces; false = usa explosionTopeCadena
  explosionTopePorFoco: true,

  // D-23: variante de Stunned "−1 dado guardado" (reduce el keep en vez del pool)
  stunnedReduceKept: false,

  // A-11-N1 (aprobado 05/08/2026): el Rey no puede ser objetivo de ataque en la
  // Ronda 1. El Rey moría en ronda 1 (87% jaque mate) y no existía partida
  // completa. Garantiza mínimo una ronda de juego. Conmutable.
  reyProtegidoRonda1: true,

  // Ítem E (aprobado 05/08/2026), A-11-N4 (H5): Stunned reduce 1 dado del pool Y
  // 1 dado del keep (cada uno mínimo 1). Prevalece sobre stunnedReduceKept (D-23)
  // cuando ambos están activos.
  stunnedDuro: false,

  // Ítem E (aprobado 05/08/2026), A-11-N5 (H4): el atacante que gana por
  // diferencia >= 2 hace retroceder 1 hex al defensor además de la herida.
  // Incentivo a atacar por encima del juego reactivo. Conmutable.
  retrocesoDefensorDiferencia2: false,

  // A-11-N6 (aprobado 05/08/2026): una unidad solo puede usar UNA Técnica por
  // ronda (antes podía combinar Muro defensivo + Técnica de ataque y repetirla
  // cada turno). El contador se resetea al iniciar cada ronda. Conmutable.
  tecnicasUnaPorRonda: true,

  // D-24/25 + D-27 (US-160/161/163, 07/08/2026): cartas con segundo uso
  // excluyente. Cada carta tiene su propia habilidad (catálogo por carta, no por
  // elemento). ON (default): cada carta puede jugarse como Habilidad (efecto, sin
  // PO) en vez de como Orden. El objetivo se elige desde una unidad aliada como
  // origen (rango/LoS) y debe cumplir el filtro de la carta (bando/rol/arquetipo).
  // OFF: MVP mínimo, toda carta se juega como Orden.
  habilitarHabilidadesCarta: true,

  // D-26 (aprobado 07/08/2026, playtest): mecánica "Lugar". Posiciones
  // estratégicas del escenario que se capturan con la acción Interactuar desde
  // un hex sobre o adyacente al lugar (distancia ≤ 1). Coste FIJO (rompe la
  // curva 1/2/3/5 a propósito, decisión explícita): 2 PO, +1 VP (marcador SOLO
  // visual — la victoria sigue siendo por eliminación total o muerte del Rey).
  // La casilla capturada se agota y pasa a `bloqueados` (impide movimiento y
  // LoS). Conmutable.
  lugarHabilitado: true,
  costeCapturaLugar: 2,
  lugarVpGanancia: 1,

  // D-28 (aprobado 11/08/2026, plantillas de mapa): el agua bloquea el
  // MOVIMIENTO pero NO la línea de visión (los arqueros disparan a través del
  // río del Valle de los Dos Vados). Los hexes de agua viven en
  // `tablero.bloqueaMovimientoSinLos` y solo se suman a los bloqueadores de LoS
  // si este flag está activo. Conmutable.
  aguaBloqueaLoS: false,

  // D-29 (aprobado 12/08/2026): terreno POR TILE. Tabla de reglas por tipo de
  // terreno — la clave es el `visual` de la matriz del escenario
  // (`tablero.terreno[key]`). El motor la consulta al mover (`costeExtra` por
  // entrar al hex) y al atacar (`modAtacante` si la línea de ataque atraviesa
  // el hex). El escenario elige el tile; acá viven las reglas. Un terreno no
  // listado = sin efecto (prado). Conmutable.
  reglasTerreno: {
    // D-30 (aprobado 12/08/2026): puente = cruce libre sobre agua (igual que el
    // vado), sin penalización de movimiento ni de combate.
    puente: { costeExtra: 0, modAtacante: 0 },
    // D-31 (aprobado 12/08/2026): empalizada v1 NO direccional. Cruzar el hex
    // cuesta +1 movimiento; si la línea de ataque atraviesa un hex de
    // empalizada, el atacante resta 1 dado. No bloquea LoS. La direccionalidad
    // por borde queda para v2.
    empalizada: { costeExtra: 1, modAtacante: -1 },
  },

  // D-33 (aprobado 12/08/2026): victoria por OBJETIVOS como sistema CORE. El
  // escenario define `tablero.objetivos` (puente a controlar + zona del lado
  // enemigo) y activa la modalidad; el motor lleva `estado.marcador` y gana
  // quien alcance el umbral o tenga más puntos al llegar al límite de rondas.
  // La muerte del Rey y la eliminación total SIGUEN ganando al instante.
  victoriaObjetivos: true,
  // D-35 (aprobado 12/08/2026): umbral y límite. Se gana al llegar a 6
  // estandartes o, al fin de la ronda 10, el que más tenga (empate → gana el
  // Rey vivo; si ambos Reyes viven o ninguno, empate). Conmutables.
  victoriaUmbral: 6,
  victoriaLimiteRondas: 10,
  // D-34 (aprobado 12/08/2026): metas de Río Tajii. +1 por enemigo eliminado;
  // +2 por mantener el control del puente al final de tu turno; +2 por cada
  // unidad tuya que termine su turno en el lado enemigo. Conmutables.
  victoriaPuntosBaja: 1,
  victoriaPuntosPuente: 2,
  victoriaPuntosCruce: 2,

  // Separación economías TEMPO / PODER (2026)
  cartaDualUso: true,              // carta se juega como Orden (PO) o Foco (token), excluyente
  activacionBaseGratis: true,      // 1 activación 0 PO por unidad/ronda
  tecnicasSoloFoco: true,          // técnicas solo con tokens en Foco (sin pago mixto)
  costesAccionExtra: [2, 4],       // curva tras la gratuita: 2ª=2 PO, 3ª=4 PO
}

export function crearReglas(overrides = {}) {
  return { ...REGLAS_POR_DEFECTO, ...overrides }
}
