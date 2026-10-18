
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import AppErrorBoundary from './components/AppErrorBoundary'
import './global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </BrowserRouter>
)
