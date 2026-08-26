import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './ui/App.jsx'
import './index.css'

// StrictMode desactivado a propósito: el motor guarda el RNG como closure mutable
// dentro del estado, y la doble invocación del updater en desarrollo avanzaría los
// dados dos veces por intención, rompiendo el determinismo semilla+intenciones.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)
