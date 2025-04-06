import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MapStateProvider } from './components/utils/mapstate'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MapStateProvider>
      <App />
    </MapStateProvider>


  </StrictMode>,
)
