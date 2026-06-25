// Startpunkt der gesamten App
// React sucht diese Datei als allererstes
// Die Datei sagt dem Browser:
// nimm den React-Code und zeige ihn im <div id="root">
// in der main.jsx an

import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n';
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

