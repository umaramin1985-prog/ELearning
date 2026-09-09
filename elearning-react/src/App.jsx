import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Contact from './pages/Contact';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Privacy from './pages/Privacy';
import Courses from './pages/Courses';
import About from './pages/About';
import Pricing from './pages/Pricing';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LiveClass from './pages/LiveClass';
import { AuthProvider } from './contexts/AuthContext';
import ParticleBackground from './components/ParticleBackground';
import './index.css';
import './pages.css';

import Profile from './pages/Profile';
import useScrollAnimation from './hooks/useScrollAnimation';
import useSmoothScroll from './hooks/useSmoothScroll';

function App() {
  useSmoothScroll();
  useScrollAnimation();
  return (
    <AuthProvider>
      <ParticleBackground />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="signin" element={<SignIn />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="courses" element={<Courses />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="live-class/:roomId" element={<ProtectedRoute><LiveClass /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
