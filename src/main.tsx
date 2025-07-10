import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GlobalBalanceProvider } from './contexts/GlobalBalanceContext'

createRoot(document.getElementById("root")!).render(
  <GlobalBalanceProvider>
    <App />
  </GlobalBalanceProvider>
);
