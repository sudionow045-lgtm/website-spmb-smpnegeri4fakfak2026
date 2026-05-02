/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Guide from './pages/Guide';
import RegistrationForm from './pages/RegistrationForm';
import AdminDashboard from './pages/AdminDashboard';
import CheckStatus from './pages/CheckStatus';
import AdminLogin from './pages/AdminLogin';

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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/panduan" element={<Guide />} />
            <Route path="/daftar" element={<RegistrationForm />} />
            <Route path="/cek-kelulusan" element={<CheckStatus />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

