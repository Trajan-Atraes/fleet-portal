import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import AdminApp from './AdminDashboard.jsx'
import MechanicApp from './MechanicDashboard.jsx'
import BillingApp from './BillingPortal.jsx'
import AccountManagerApp from './AccountManagerDashboard.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<App />} />
        <Route path="/admin"           element={<AdminApp />} />
        <Route path="/mechanic"        element={<MechanicApp />} />
        <Route path="/billing"         element={<BillingApp />} />
        <Route path="/account-manager" element={<AccountManagerApp />} />
        <Route path="*"                element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
