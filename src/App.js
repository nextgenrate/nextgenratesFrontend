import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage         from './pages/auth/LoginPage';
import RegisterPage      from './pages/auth/RegisterPage';
import { ResetPasswordPage, SetPasswordPage } from './pages/auth/AuthHelpers';
import KycPage           from './pages/kyc/KycPage';
import RateSearchPage    from './pages/rate-search/RateSearchPage';
import RateResultsPage   from './pages/rate-search/RateResultsPage';
import EnquiriesPage     from './pages/enquiries/EnquiriesPage';
import QuotesPage        from './pages/quotes/QuotesPage';
import BookingsPage      from './pages/bookings/BookingsPage';
import CreateBookingPage from './pages/bookings/CreateBookingPage';
import ProfilePage       from './pages/profile/ProfilePage';

/* ── Loader ── */
const Loader = () => (
  <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0F4FF' }}>
    <div style={{ textAlign:'center' }}>
      <div style={{ width:44, height:44, border:'3px solid #D4DCFF', borderTopColor:'#1A3CC8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }}/>
      <div style={{ fontSize:13, color:'#7B8EC0', fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
  </div>
);

/* ── Pending approval holding screen ── */
function PendingScreen() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0F4FF', padding:20, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'48px 40px', maxWidth:500, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(13,27,94,.14)', border:'1px solid #D4DCFF' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>⏳</div>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0D1535', marginBottom:10, fontFamily:"'Outfit',sans-serif" }}>Account Under Review</h2>
        <p style={{ fontSize:14, color:'#3A4A7A', lineHeight:1.75, marginBottom:20 }}>
          Your company registration is being reviewed by our compliance team.
          You'll receive an email once your account is activated — typically within 24–48 business hours.
        </p>
        <div style={{ padding:'14px 18px', background:'#FFF8E6', border:'1px solid #FDE68A', borderRadius:12, marginBottom:28, textAlign:'left' }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#C47B00', marginBottom:8 }}>What happens next?</div>
          {['Our team reviews your company documents','Account activated upon approval','You receive a confirmation email','Sign in and complete KYC to access all features'].map((s,i) => (
            <div key={i} style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'#78350F', marginBottom:i<3?6:0 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:'#FEF08A', border:'1px solid #FDE68A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0 }}>{i+1}</div>
              {s}
            </div>
          ))}
        </div>
        <button onClick={async () => { await logout(); navigate('/login'); }}
          style={{ padding:'12px 32px', background:'linear-gradient(135deg,#1A3CC8,#1E50FF)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ROUTE GUARDS
══════════════════════════════════════════════ */

/*
  Guard 1 — PROTECTED ROUTE
  Requires: logged in + account active (not pending_approval)
  Used for: /kyc, /profile, /set-password
  Does NOT enforce KYC — lets user access KYC upload page freely
*/
function ProtectedRoute({ children }) {
  const { user, initializing, mustChangePassword } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    if (initializing || !user) return;
    if (mustChangePassword && location.pathname !== '/set-password') {
      navigate('/set-password', { replace: true });
    }
  }, [user, initializing, mustChangePassword, location.pathname, navigate]);

  if (initializing) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.status === 'pending_approval') return <PendingScreen />;

  return children;
}

/*
  Guard 2 — KYC PROTECTED ROUTE
  Requires: logged in + active account + kyc.status === 'approved'
  Used for: /rate-search, /bookings, /enquiries, /quotes
  Redirects to /kyc if KYC not approved yet.
  
  NOTE: Uses navigate in useEffect (not render-phase redirect) to avoid
  fighting with the KYC page's own state transitions.
*/
function KycProtectedRoute({ children }) {
  const { user, initializing, kycStatus, mustChangePassword } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    if (initializing || !user) return;
    if (user.status === 'pending_approval') return; // PendingScreen handles it

    if (mustChangePassword && location.pathname !== '/set-password') {
      navigate('/set-password', { replace: true });
      return;
    }

    if (kycStatus !== 'approved') {
      navigate('/kyc', { replace: true });
    }
  }, [user, initializing, kycStatus, mustChangePassword, location.pathname, navigate]);

  if (initializing) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.status === 'pending_approval') return <PendingScreen />;

  // Render children immediately — useEffect will redirect async if needed
  // This prevents a flash of wrong content by showing loader when kyc not ready
  if (kycStatus !== 'approved') return <Loader />;

  return children;
}

/*
  Guard 3 — PUBLIC ROUTE
  Redirect logged-in ACTIVE users away from login/register
  Pending-approval users can stay on public routes (they see PendingScreen on protected routes)
*/
function PublicRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  if (user && user.status === 'active') {
    return <Navigate to="/rate-search" replace />;
  }
  return children;
}

/* ══════════════════════════════════════════════
   APP ROUTES
══════════════════════════════════════════════ */
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"          element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"       element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Requires active account — no KYC gate */}
      <Route path="/set-password"   element={<ProtectedRoute><SetPasswordPage /></ProtectedRoute>} />
      <Route path="/kyc"            element={<ProtectedRoute><KycPage /></ProtectedRoute>} />
      <Route path="/profile"        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/:tab"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Requires active account + KYC approved */}
      <Route path="/rate-search"     element={<KycProtectedRoute><RateSearchPage /></KycProtectedRoute>} />
      <Route path="/rates/results"   element={<KycProtectedRoute><RateResultsPage /></KycProtectedRoute>} />
      <Route path="/enquiries"       element={<KycProtectedRoute><EnquiriesPage /></KycProtectedRoute>} />
      <Route path="/quotes"          element={<KycProtectedRoute><QuotesPage /></KycProtectedRoute>} />
      <Route path="/bookings"        element={<KycProtectedRoute><BookingsPage /></KycProtectedRoute>} />
      <Route path="/bookings/create" element={<KycProtectedRoute><CreateBookingPage /></KycProtectedRoute>} />

      <Route path="/"  element={<Navigate to="/rate-search" replace />} />
      <Route path="*"  element={<Navigate to="/rate-search" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
