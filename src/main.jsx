import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './tokens.css'
import './global.css'

// Apply saved theme before first paint
const saved = localStorage.getItem('htl-theme')
const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
document.documentElement.setAttribute('data-theme', saved || system)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/aims-htl/">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
