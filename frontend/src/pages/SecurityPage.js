import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  TextField
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SecurityPage = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { token: authToken, user } = useAuth(); // We need to check if 2FA is already enabled on the user object
  const api = axios.create({
      baseURL: '/api',
      headers: { 'x-auth-token': authToken }
  });

  const handleGenerateSecret = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/security/2fa/generate');
      setQrCodeUrl(res.data.qrCodeUrl);
    } catch (err) {
      setError('Failed to generate 2FA secret.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
          const res = await api.post('/security/2fa/verify', { token });
          setSuccess(res.data.msg);
          setQrCodeUrl(''); // Hide QR code after successful verification
          // You would typically refetch the user object here to update the 2FA status
      } catch (err) {
          setError(err.response?.data?.msg || 'Verification failed.');
      } finally {
          setLoading(false);
      }
  };

  const handleDisable2FA = async () => {
    if (window.confirm('Are you sure you want to disable 2FA?')) {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/security/2fa/disable');
            setSuccess(res.data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to disable 2FA.');
        } finally {
            setLoading(false);
        }
    }
  };

  // This is a simplified check. A real app would get this from the user object in AuthContext.
  const is2faEnabled = user?.two_factor_enabled;

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" sx={{ mb: 4 }}>Security Settings</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Two-Factor Authentication (2FA)</Typography>
        {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
        {success && <Alert severity="success" sx={{mb: 2}}>{success}</Alert>}

        {is2faEnabled ? (
            <Box>
                <Alert severity="success">2FA is currently enabled on your account.</Alert>
                <Button variant="contained" color="error" onClick={handleDisable2FA} sx={{mt: 2}} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Disable 2FA'}
                </Button>
            </Box>
        ) : (
            <Box>
                {!qrCodeUrl ? (
                    <>
                        <Typography>Enable 2FA to add an extra layer of security to your account.</Typography>
                        <Button variant="contained" onClick={handleGenerateSecret} sx={{mt: 2}} disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Enable 2FA'}
                        </Button>
                    </>
                ) : (
                    <Box>
                        <Typography gutterBottom>1. Scan the QR code with your authenticator app.</Typography>
                        <img src={qrCodeUrl} alt="2FA QR Code" />
                        <Typography sx={{mt: 2}} gutterBottom>2. Enter the 6-digit code from your app to verify.</Typography>
                        <TextField label="Verification Code" value={token} onChange={e => setToken(e.target.value)} sx={{mr: 2}} />
                        <Button variant="contained" onClick={handleVerifyToken} disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Verify & Activate'}
                        </Button>
                    </Box>
                )}
            </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SecurityPage;
