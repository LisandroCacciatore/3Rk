export function crearLog() {
  return []
}

export function agregarEvento(log, evento, turno) {
  return [...log, {
    // Timestamp determinista: el índice del evento en el log. El motor no usa
    // reloj de pared (Date.now() rompía la reproducción byte-a-byte con la
    // misma semilla); nada del sistema lee el timestamp como hora real.
    timestamp: log.length,
    ...evento,
    turno: turno ?? evento.turno ?? null,
  }]
}
