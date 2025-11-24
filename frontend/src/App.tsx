import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BandProvider } from './contexts/BandContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateBand from './pages/CreateBand';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ManageBand from './pages/ManageBand';
import Setlists from './pages/Setlists';
import Shows from './pages/Shows';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <BandProvider>
          <Routes>
            {/* Auth routes - NO side menu */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Create band route - After signup, before home */}
            <Route 
              path="/create-band" 
              element={
                <ProtectedRoute>
                  <CreateBand />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - WITH side menu */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="manage-band" element={<ManageBand />} />
              <Route path="setlists" element={<Setlists />} />
              <Route path="shows" element={<Shows />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
            
            {/* Root redirects to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BandProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;