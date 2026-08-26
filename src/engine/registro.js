import { crearEstadoInicial } from './state.js'
import { aplicarIntencion } from './index.js'

// D-21: el registro exportado es JSON plano: semilla + escenario + reglas +
// secuencia de intenciones aplicadas. Con eso se puede reproducir la partida
// tal cual (incluido el mapa en el que se jugó).
export function exportarRegistro(estado) {
  return {
    semilla: estado.semilla,
    escenario: estado.escenario || 'base',
    reglas: estado.reglas,
    secuencia: estado.secuencia || [],
  }
}

// Reproduce una partida desde una semilla, su escenario y su secuencia de
// intenciones. Misma semilla + mismo escenario + misma secuencia = misma
// partida (determinismo del motor).
export function reproducirPartida(semilla, secuencia, escenarioNombre) {
  let estado = crearEstadoInicial(semilla, escenarioNombre)
  for (const intencion of secuencia || []) {
    estado = aplicarIntencion(estado, intencion)
  }
  return estado
}
