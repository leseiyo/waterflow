import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DistributorDashboard from './pages/DistributorDashboard';
import ConsumerDashboard from './pages/ConsumerDashboard';
import OrderTracking from './pages/OrderTracking';
import DistributorProfile from './pages/DistributorProfile';
import ConsumerProfile from './pages/ConsumerProfile';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children, userType }) => {
  const { user, userType: currentUserType } = useAuth();
  
  console.log('ProtectedRoute: Checking access for userType:', userType);
  console.log('ProtectedRoute: Current user:', user);
  console.log('ProtectedRoute: Current userType:', currentUserType);
  
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (userType && currentUserType !== userType) {
    console.log('ProtectedRoute: User type mismatch, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  console.log('ProtectedRoute: Access granted');
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <Header />
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/distributor/dashboard" 
                  element={
                    <ProtectedRoute userType="distributor">
                      <DistributorDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/consumer/dashboard" 
                  element={
                    <ProtectedRoute userType="consumer">
                      <ConsumerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/order/:orderId/tracking" 
                  element={
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/distributor/profile" 
                  element={
                    <ProtectedRoute userType="distributor">
                      <DistributorProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/consumer/profile" 
                  element={
                    <ProtectedRoute userType="consumer">
                      <ConsumerProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/distributor/:id" element={<DistributorProfile />} />
              </Routes>
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;