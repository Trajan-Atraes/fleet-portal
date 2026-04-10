import { StrictMode, lazy, Suspense, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import './styles/shared.css'

const App               = lazy(() => import('./App.jsx'))
const AdminApp          = lazy(() => import('./AdminDashboard.jsx'))
const MechanicApp       = lazy(() => import('./MechanicDashboard.jsx'))
const BillingApp        = lazy(() => import('./BillingPortal.jsx'))
const AccountManagerApp = lazy(() => import('./AccountManagerDashboard.jsx'))

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (!offline) return null;
  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, zIndex:9999,
      background:"#dc2626", color:"#fff", textAlign:"center",
      padding:"6px 16px", fontSize:12, fontWeight:600,
      fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em",
      textTransform:"uppercase",
    }}>
      You are offline — changes may not save
    </div>
  );
}

function Loading() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#070b11", color: "#738fa8", fontFamily: "'Barlow',sans-serif", fontSize: 14,
    }}>
      Loading…
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <OfflineBanner />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/"                element={<App />} />
          <Route path="/admin"           element={<AdminApp />} />
          <Route path="/mechanic"        element={<MechanicApp />} />
          <Route path="/billing"         element={<BillingApp />} />
          <Route path="/account-manager" element={<AccountManagerApp />} />
          <Route path="*"                element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
