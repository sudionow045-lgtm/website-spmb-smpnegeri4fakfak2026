/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better initial performance
const Home = lazy(() => import('./pages/Home'));
const Guide = lazy(() => import('./pages/Guide'));
const RegistrationForm = lazy(() => import('./pages/RegistrationForm'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CheckStatus = lazy(() => import('./pages/CheckStatus'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="animate-spin text-blue-600" size={40} />
  </div>
);

function RouteHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home on initial load/reload if not on home, admin, or other valid pages
    const validPaths = ['/', '/panduan', '/daftar', '/cek-kelulusan'];
    const isSpecialPath = location.pathname.startsWith('/admin');
    
    if (!validPaths.includes(location.pathname) && !isSpecialPath) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this only runs once on app mount (reload)

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteHandler />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/panduan" element={<Guide />} />
              <Route path="/daftar" element={<RegistrationForm />} />
              <Route path="/cek-kelulusan" element={<CheckStatus />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

