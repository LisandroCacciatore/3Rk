// Sonido sutil de la fase UI-02 (US-100). WebAudio con osciladores simples:
// sin assets, sin red, sin dependencias. Si el navegador bloquea el audio o
// no hay AudioContext, todo se ignora en silencio: el juego nunca se traba
// por culpa del sonido. Es feedback de presentación, no una regla.

let ctx = null

function obtenerCtx() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    try {
      ctx = new AC()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

function tono(tipo, fInicial, fFinal, duracion, ganancia, retraso = 0) {
  const ac = obtenerCtx()
  if (!ac) return
  try {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    const t0 = ac.currentTime + retraso
    osc.type = tipo
    osc.frequency.setValueAtTime(fInicial, t0)
    if (fFinal !== fInicial) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, fFinal), t0 + duracion)
    }
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(ganancia, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion)
    osc.connect(g)
    g.connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + duracion + 0.02)
  } catch {
    // silencio
  }
}

function ruido(duracion, ganancia, retraso = 0) {
  const ac = obtenerCtx()
  if (!ac) return
  try {
    const buffer = ac.createBuffer(
      1,
      Math.max(1, Math.floor(ac.sampleRate * duracion)),
      ac.sampleRate
    )
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ac.createBufferSource()
    src.buffer = buffer
    const filtro = ac.createBiquadFilter()
    filtro.type = 'bandpass'
    filtro.frequency.value = 1800
    const g = ac.createGain()
    const t0 = ac.currentTime + retraso
    g.gain.setValueAtTime(ganancia, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion)
    src.connect(filtro)
    filtro.connect(g)
    g.connect(ac.destination)
    src.start(t0)
    src.stop(t0 + duracion + 0.02)
  } catch {
    // silencio
  }
}

// Dados golpeando el tablero.
export function sonidoDados() {
  ruido(0.16, 0.35)
  tono('square', 320, 170, 0.12, 0.14)
}

// Impacto de herida.
export function sonidoImpacto() {
  ruido(0.22, 0.5)
  tono('sawtooth', 140, 55, 0.18, 0.3)
}

// Carta jugada como Orden.
export function sonidoCarta() {
  tono('triangle', 620, 780, 0.09, 0.18)
  tono('triangle', 880, 940, 0.08, 0.14, 0.07)
}

// Fanfarria corta de victoria.
export function sonidoFanfarria() {
  tono('triangle', 523, 523, 0.16, 0.24)
  tono('triangle', 659, 659, 0.16, 0.24, 0.16)
  tono('triangle', 784, 784, 0.22, 0.28, 0.32)
  tono('triangle', 1047, 1047, 0.34, 0.32, 0.5)
}

// Debe llamarse en el primer gesto del usuario: desbloquea el AudioContext
// en navegadores que exigen interacción previa para reproducir audio.
export function desbloquearAudio() {
  obtenerCtx()
}
