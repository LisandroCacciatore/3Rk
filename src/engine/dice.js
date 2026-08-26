export function mulberry32(seed) {
  let state = seed | 0
  return function () {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function tirarDado(rng, caras = 10) {
  return Math.floor(rng() * caras) + 1
}

export function tirarDados(rng, cantidad, caras = 10) {
  const resultados = []
  for (let i = 0; i < cantidad; i++) {
    resultados.push(tirarDado(rng, caras))
  }
  return resultados
}

export function tirarDadosConKeep(rng, dados, keep, caras = 10) {
  const tiradas = tirarDados(rng, dados, caras)
  const ordenadas = [...tiradas].sort((a, b) => b - a)
  return {
    tiradas,
    kept: ordenadas.slice(0, keep),
    suma: ordenadas.slice(0, keep).reduce((a, b) => a + b, 0),
  }
}

export function tirarD10(rng, umbralExplosion = 10, topeCadena = 20) {
  const valores = []
  let valor = tirarDado(rng, 10)
  valores.push(valor)
  while (valor >= umbralExplosion && valores.length < topeCadena) {
    valor = tirarDado(rng, 10)
    valores.push(valor)
  }
  return {
    valorTotal: valores.reduce((a, b) => a + b, 0),
    valores,
    exploto: valores.length > 1,
  }
}

export function tirarPool(rng, dados, keep, umbralExplosion = 10, topeCadena = 20) {
  const dadosTirados = []
  for (let i = 0; i < dados; i++) {
    dadosTirados.push(tirarD10(rng, umbralExplosion, topeCadena))
  }
  const ordenados = [...dadosTirados].sort((a, b) => b.valorTotal - a.valorTotal)
  const kept = ordenados.slice(0, keep)
  return {
    dadosTirados,
    kept,
    suma: kept.reduce((a, b) => a + b.valorTotal, 0),
  }
}

export function barajar(array, rng) {
  const resultado = [...array]
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[resultado[i], resultado[j]] = [resultado[j], resultado[i]]
  }
  return resultado
}
