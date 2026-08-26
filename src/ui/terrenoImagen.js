// Rutas de tiles de terreno raster. La beta pinta el terreno con estos PNG; si un
// tipo no tiene asset registrado (o el archivo falla en runtime), el hex muestra
// su gradiente/decorado de respaldo.
// Determinista y sin latch: la ruta se decide por el map (no por un probe de
// carga), de modo que el <image> se monta SIEMPRE y el fallback solo asoma si la
// decodificacion falla. Un onerror sole no tumba los 150 tiles ni se queda fijo.
// Presentacional: el motor no importa este modulo.
const publico = (nombre) => `${import.meta.env?.BASE_URL || '/'}assets/tierras/${nombre}`

export const ASSETS_TERRENO = {
  prado: publico('prado.png'),
  bosque: publico('bosque.png'),
  agua: publico('agua.png'),
  montaña: publico('montaña.png'),
  camino: publico('camino.png'),
  puente: publico('puente.png'),
  empalizada: publico('empalizada.png'),
  ruina: publico('ruina.png'),
  bloqueado: publico('bloqueado.png'),
}

// Devuelve la URL del tile para el tipo (o null si no está registrado).
// No es un hook: va a revisar el map, no hace sondeo ni espera onload.
export function assetTerreno(tipo) {
  return Object.prototype.hasOwnProperty.call(ASSETS_TERRENO, tipo)
    ? ASSETS_TERRENO[tipo]
    : null
}