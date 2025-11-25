import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        message.error('Google authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token) {
        try {
          // Store the token and set auth state
          localStorage.setItem('token', token);
          
          // Get user details
          const user = await authService.getCurrentUser();
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update auth context
          setAuthToken(token, user);
          
          message.success('Welcome! You are now logged in.');
          
          // Check if user has a band, redirect accordingly
          navigate('/home/dashboard');
          
        } catch (error) {
          console.error('Failed to get user details:', error);
          message.error('Authentication failed. Please try again.');
          localStorage.removeItem('token');
          navigate('/login');
        }
      } else {
        message.error('No authentication token received.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthToken]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      width: '100vw',
      background: '#f0f2f5',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <Spin size="large" />
      <p style={{ marginTop: 24, color: '#666' }}>Completing sign in...</p>
    </div>
  );
};

export default GoogleCallback;