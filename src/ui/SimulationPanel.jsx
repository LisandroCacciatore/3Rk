// US-101 — Panel de simulación Bot vs Bot en el navegador.
// US-103 — Telemetría agregada de la tanda simulada.
//
// REUTILIZA, no reescribe: jugarPartida / resumenDePartida / BOTS de
// sim/jugar-partida.js (que a su vez usa sim/bots.js y sim/metricas.js).
// No escribe bots nuevos ni métricas nuevas: solo agrega los resultados y
// los presenta. Determinista: las semillas son fijas por índice (sim-N), así
// que re-ejecutar la misma configuración produce exactamente la misma tanda.
import React, { useState } from 'react'
import { jugarPartida, resumenDePartida, BOTS } from '../../sim/jugar-partida.js'

const NOMBRES_BOT = {
  aleatorio: 'Aleatorio',
  codicioso: 'Codicioso',
  ahorrador: 'Ahorrador',
}

const OPCIONES_CANT = [5, 10, 25, 50, 100]

function promedio(numeros) {
  if (numeros.length === 0) return 0
  return numeros.reduce((s, n) => s + n, 0) / numeros.length
}

function sumar(iterable) {
  return iterable.reduce((s, n) => s + n, 0)
}

function agregarArquetipos(resumenes) {
  const agregado = {}
  for (const r of resumenes) {
    const porArq = r.metricas?.arquetipos || {}
    for (const [arq, m] of Object.entries(porArq)) {
      if (!agregado[arq]) {
        agregado[arq] = {
          vecesAtacando: 0,
          dañoRealizado: 0,
          vecesDefendiendo: 0,
          dañoRecibido: 0,
          vecesDerrotado: 0,
          rondasSobrevividas: [],
          tecnicasUtilizadas: 0,
          focoUtilizado: 0,
          porFaccion: {
            A: { dañoRealizado: 0, dañoRecibido: 0, vecesDerrotado: 0, rondasSobrevividas: [] },
            B: { dañoRealizado: 0, dañoRecibido: 0, vecesDerrotado: 0, rondasSobrevividas: [] },
          },
        }
      }
      agregado[arq].vecesAtacando += m.vecesAtacando || 0
      agregado[arq].dañoRealizado += m.dañoRealizado || 0
      agregado[arq].vecesDefendiendo += m.vecesDefendiendo || 0
      agregado[arq].dañoRecibido += m.dañoRecibido || 0
      agregado[arq].vecesDerrotado += m.vecesDerrotado || 0
      agregado[arq].tecnicasUtilizadas += m.tecnicasUtilizadas || 0
      agregado[arq].focoUtilizado += m.focoUtilizado || 0
      if (Number.isFinite(m.rondasSobrevividas)) {
        agregado[arq].rondasSobrevividas.push(m.rondasSobrevividas)
      }
      for (const fac of ['A', 'B']) {
        const f = m.porFaccion?.[fac]
        if (!f) continue
        agregado[arq].porFaccion[fac].dañoRealizado += f.dañoRealizado || 0
        agregado[arq].porFaccion[fac].dañoRecibido += f.dañoRecibido || 0
        agregado[arq].porFaccion[fac].vecesDerrotado += f.vecesDerrotado || 0
        if (Number.isFinite(f.rondasSobrevividas)) {
          agregado[arq].porFaccion[fac].rondasSobrevividas.push(f.rondasSobrevividas)
        }
      }
    }
  }
  for (const m of Object.values(agregado)) {
    m.rondasSobrevividas = promedio(m.rondasSobrevividas)
    for (const fac of ['A', 'B']) {
      m.porFaccion[fac].rondasSobrevividas = promedio(m.porFaccion[fac].rondasSobrevividas)
    }
  }
  return agregado
}

export function agregarResultados(resumenes) {
  const n = resumenes.length
  const terminadas = resumenes.filter(r => r.metricas?.ganador)
  const winA = terminadas.filter(r => r.metricas.ganador === 'A').length
  const winB = terminadas.filter(r => r.metricas.ganador === 'B').length
  const noTerminadas = n - terminadas.length
  const tasasAtacante = resumenes
    .map(r => r.metricas?.tasaAtacanteGlobal)
    .filter(t => t != null)

  return {
    n,
    terminadas: terminadas.length,
    noTerminadas,
    winA,
    winB,
    pctA: n ? (winA / n) * 100 : 0,
    pctB: n ? (winB / n) * 100 : 0,
    rondasProm: promedio(resumenes.map(r => r.rondas || 0)),
    eliminacionesProm: promedio(resumenes.map(r => r.eliminaciones || 0)),
    focoTokens: sumar(resumenes.map(r => r.metricas?.tokensFocoGenerados || 0)),
    tecnicasUsadas: sumar(resumenes.map(r => r.metricas?.tecnicasUsadas || 0)),
    focoARitmoProm: promedio(
      resumenes.map(r => r.metricas?.turnosPrimerTokenAPrimeraTecnica).filter(t => t != null)
    ),
    pctAccionesCaras: promedio(resumenes.map(r => r.metricas?.pctAccionesCaras || 0)),
    tasaAtacanteProm: promedio(tasasAtacante),
    poGeneradosProm: promedio(resumenes.map(r => r.metricas?.poGenerados || 0)),
    poPerdidosProm: promedio(resumenes.map(r => r.metricas?.poPerdidos || 0)),
    arquetipos: agregarArquetipos(resumenes),
  }
}

function Desequilibrio({ a, b }) {
  if (a >= 60 && a - b >= 20) {
    return <span className="tele-alerta">Desequilibrio marcado hacia Fuego</span>
  }
  if (b >= 60 && b - a >= 20) {
    return <span className="tele-alerta">Desequilibrio marcado hacia Agua</span>
  }
  return <span className="tele-ok">Sin desequilibrios extremos</span>
}

export default function SimulationPanel({ onClose }) {
  const [botA, setBotA] = useState('codicioso')
  const [botB, setBotB] = useState('ahorrador')
  const [cant, setCant] = useState(10)
  const [corriendo, setCorriendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [resultados, setResultados] = useState([])

  const ejecutar = async () => {
    setCorriendo(true)
    setProgreso(0)
    setResultados([])
    const acumulados = []
    const lote = Math.max(1, Math.round(cant / 20))
    for (let i = 1; i <= cant; i++) {
      const semilla = `sim-${i}`
      const partida = jugarPartida({ semilla, botA, botB })
      acumulados.push(resumenDePartida(partida.estado, semilla, partida.motivo))
      if (i % lote === 0 || i === cant) {
        setProgreso(i)
        await new Promise(r => setTimeout(r, 0))
      }
    }
    setResultados(acumulados)
    setProgreso(cant)
    setCorriendo(false)
  }

  const tele = agregarResultados(resultados)

  return (
    <div className="sim-overlay">
      <div className="sim-panel">
        <header className="sim-cabecera">
          <strong>Simulación Bot vs Bot</strong>
          <button className="btn-cancelar" onClick={onClose}>Cerrar</button>
        </header>

        <div className="sim-controles">
          <label>
            Fuego (A)
            <select value={botA} onChange={e => setBotA(e.target.value)}>
              {Object.keys(BOTS).map(k => (
                <option key={k} value={k}>{NOMBRES_BOT[k]}</option>
              ))}
            </select>
          </label>
          <label>
            Agua (B)
            <select value={botB} onChange={e => setBotB(e.target.value)}>
              {Object.keys(BOTS).map(k => (
                <option key={k} value={k}>{NOMBRES_BOT[k]}</option>
              ))}
            </select>
          </label>
          <label>
            Partidas
            <select value={cant} onChange={e => setCant(Number(e.target.value))}>
              {OPCIONES_CANT.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <button className="btn-jugar" onClick={ejecutar} disabled={corriendo}>
            {corriendo ? `Ejecutando… ${progreso}/${cant}` : 'Ejecutar simulación'}
          </button>
        </div>

        {corriendo && (
          <div className="sim-progreso">
            <div className="sim-barra" style={{ width: `${(progreso / cant) * 100}%` }} />
          </div>
        )}

        {resultados.length > 0 && (
          <div className="sim-resultados">
            <section>
              <h4 className="panel-titulo">Resumen ({tele.n})</h4>
              <div className="sim-grid">
                <div className="sim-metrica sim-fuego">
                  <span className="sim-valor">{(tele.pctA).toFixed(0)}%</span>
                  <span className="sim-etiqueta">Victorias Fuego ({tele.winA})</span>
                </div>
                <div className="sim-metrica sim-agua">
                  <span className="sim-valor">{(tele.pctB).toFixed(0)}%</span>
                  <span className="sim-etiqueta">Victorias Agua ({tele.winB})</span>
                </div>
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.rondasProm.toFixed(1)}</span>
                  <span className="sim-etiqueta">Rondas promedio</span>
                </div>
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.eliminacionesProm.toFixed(1)}</span>
                  <span className="sim-etiqueta">Eliminados por partida</span>
                </div>
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.noTerminadas}</span>
                  <span className="sim-etiqueta">Sin terminar</span>
                </div>
              </div>
            </section>

            <section>
              <h4 className="panel-titulo">Foco (diferenciado de PO)</h4>
              <div className="sim-grid">
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.focoTokens}</span>
                  <span className="sim-etiqueta">Tokens de Foco generados</span>
                </div>
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.tecnicasUsadas}</span>
                  <span className="sim-etiqueta">Técnicas usadas</span>
                </div>
                <div className="sim-metrica">
                  <span className="sim-valor">
                    {tele.focoARitmoProm ? tele.focoARitmoProm.toFixed(1) : '—'}
                  </span>
                  <span className="sim-etiqueta">Turnos 1er token → 1ª técnica</span>
                </div>
              </div>
            </section>

            <section>
              <h4 className="panel-titulo">Telemetría</h4>
              <div className="sim-grid">
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.tasaAtacanteProm ? (tele.tasaAtacanteProm * 100).toFixed(0) : '—'}%</span>
                  <span className="sim-etiqueta">Victoria media del atacante</span>
                </div>
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.pctAccionesCaras.toFixed(0)}%</span>
                  <span className="sim-etiqueta">Acciones caras (3º/4º escalón)</span>
                </div>
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.poGeneradosProm.toFixed(0)}</span>
                  <span className="sim-etiqueta">PO generados por partida</span>
                </div>
                <div className="sim-metrica">
                  <span className="sim-valor">{tele.poPerdidosProm.toFixed(0)}</span>
                  <span className="sim-etiqueta">PO perdidos por partida</span>
                </div>
              </div>
              <div className="sim-extremos">
                <Desequilibrio a={tele.pctA} b={tele.pctB} />
                <span className="sim-semillas">Semillas fijas sim-1..{tele.n} — re-ejecutar produce la misma tanda</span>
              </div>
            </section>

            {Object.keys(tele.arquetipos).length > 0 && (
              <section>
                <h4 className="panel-titulo">Por arquetipo (US-106)</h4>
                <table className="sim-tabla-arquetipos">
                  <thead>
                    <tr>
                      <th>Arquetipo</th>
                      <th>Daño hecho</th>
                      <th>Daño recibido</th>
                      <th>Derrotado</th>
                      <th>Rondas vivos</th>
                      <th>Técnicas</th>
                      <th>Foco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tele.arquetipos)
                      .sort((a, b) => (b[1].dañoRealizado - b[1].dañoRecibido) - (a[1].dañoRealizado - a[1].dañoRecibido))
                      .map(([arq, m]) => {
                        const saldo = m.dañoRealizado - m.dañoRecibido
                        const balanceClase = saldo < -2 ? 'tele-alerta' : saldo > 2 ? 'tele-bien' : ''
                        return (
                          <tr key={arq} className={balanceClase}>
                            <td>{arq}</td>
                            <td>{m.dañoRealizado}</td>
                            <td>{m.dañoRecibido}</td>
                            <td>{m.vecesDerrotado}</td>
                            <td>{m.rondasSobrevividas ? m.rondasSobrevividas.toFixed(1) : '—'}</td>
                            <td>{m.tecnicasUtilizadas}</td>
                            <td>{m.focoUtilizado}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
                <div className="sim-grid">
                  {['A', 'B'].map(fac => (
                    <div key={fac} className={`sim-metrica ${fac === 'A' ? 'sim-fuego' : 'sim-agua'}`}>
                      <span className="sim-etiqueta">
                        Facción {fac} — daño hecho vs recibido
                      </span>
                      <span className="sim-valor">
                        {Object.entries(tele.arquetipos)
                          .map(([arq, m]) => `${arq} ${m.porFaccion?.[fac]?.dañoRealizado ?? 0}→${m.porFaccion?.[fac]?.dañoRecibido ?? 0}`)
                          .join(' · ')}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
