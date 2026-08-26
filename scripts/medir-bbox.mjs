// Medición del bbox alfa de los sprites de unidad (public/assets/units/*.png).
// Genera las métricas para sprites.js: cx (centro X) y bottom (borde inferior)
// normalizados a una base de 500 px, y escala que normaliza el ALTO visible a
// TARGET_ALTO px (antes del boost ESCALA_SPRITE de sprites.js).
// Uso: node scripts/medir-bbox.mjs  (ALPHA=NN para umbral de alfa, opcional)
import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const DIR = path.resolve('public/assets/units')
const FACCIONES = ['fuego', 'agua', 'tierra', 'aire']
const ARQUETIPOS = ['Peon', 'Alfil', 'Torre', 'Caballo', 'Campeon', 'Rey']
const BASE = 500
const TARGET_ALTO = 42
const THRESHOLD = Number(process.env.ALPHA || 0)

function bbox(png, threshold) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const alpha = png.data[(png.width * y + x) * 4 + 3]
      if (alpha > threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, minY, maxX, maxY }
}

const salida = {}
for (const f of FACCIONES) {
  for (const a of ARQUETIPOS) {
    const file = path.join(DIR, `${f}_${a.toLowerCase()}.png`)
    if (!fs.existsSync(file)) {
      console.error(`FALTA ${file}`)
      continue
    }
    const png = PNG.sync.read(fs.readFileSync(file))
    const { minX, minY, maxX, maxY } = bbox(png, THRESHOLD)
    const kx = BASE / png.width
    const ky = BASE / png.height
    const cx = ((minX + maxX) / 2) * kx
    const bottom = maxY * ky
    const alto = (maxY - minY) * ky
    const escala = TARGET_ALTO / alto
    salida[`${f}_${a}`] = { cx: +cx.toFixed(2), bottom: +bottom.toFixed(2), escala: +escala.toFixed(6) }
    console.log(
      `${f}_${a}: ${png.width}x${png.height} bbox=[${minX},${minY}..${maxX},${maxY}] ` +
      `cx=${cx.toFixed(2)} bottom=${bottom.toFixed(2)} escala=${escala.toFixed(6)}`
    )
  }
}
console.log(JSON.stringify(salida, null, 2))