import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AIProvider } from './contexts/AIContext'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import './styles/globals.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/YieldScope">
        <AIProvider>
          <App />
        </AIProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
