import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/CompleteAcademicAIApp'
import { ThemeProvider } from './contexts/ThemeContext'
import { installChunkLoadErrorHandler } from './utils/lazyWithRetry'
import { installCreditSpendObserver } from './utils/credits'
import './index.css'

// Recover from stale-deploy chunk load failures with a one-shot hard reload.
// Without this, users with cached HTML pointing to old chunk filenames see
// a broken page until they manually refresh. Done before render so the
// error handlers are attached before React's lazy() boundary fires.
installChunkLoadErrorHandler()
// Keep the top-right credit counter current after anything spends a credit.
installCreditSpendObserver()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)

