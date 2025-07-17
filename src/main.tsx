import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { GlobalBalanceProvider } from './contexts/GlobalBalanceContext'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <GlobalBalanceProvider>
      <App />
    </GlobalBalanceProvider>
  </AuthProvider>
);
