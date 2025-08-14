import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, Navigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWith2fa, isAuthenticated } = useAuth();

  // Form states
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [totpToken, setTotpToken] = useState('');

  // Control states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2faForm, setShow2faForm] = useState(false);
  const [challengeToken, setChallengeToken] = useState('');

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(formData.email, formData.password);
      if (res.twoFactorRequired) {
        setShow2faForm(true);
        setChallengeToken(res.challengeToken);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handle2faSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        await loginWith2fa(challengeToken, totpToken);
        navigate('/');
    } catch (err) {
        setError(err.response?.data?.msg || 'An error occurred during 2FA verification.');
    } finally {
        setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          {show2faForm ? 'Two-Factor Authentication' : 'Sign In'}
        </Typography>

        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}

        {!show2faForm ? (
            <Box component="form" onSubmit={handlePasswordSubmit} noValidate sx={{ mt: 1 }}>
              <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={formData.email} onChange={onChange} disabled={loading} />
              <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={formData.password} onChange={onChange} disabled={loading} />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
              <Grid container>
                <Grid item xs><Link component={RouterLink} to="/request-password-reset" variant="body2">Forgot password?</Link></Grid>
                <Grid item><Link component={RouterLink} to="/register" variant="body2">{"Don't have an account? Sign Up"}</Link></Grid>
              </Grid>
            </Box>
        ) : (
            <Box component="form" onSubmit={handle2faSubmit} noValidate sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{mt: 1, mb: 1}}>Enter the code from your authenticator app.</Typography>
                <TextField margin="normal" required fullWidth name="totpToken" label="6-Digit Code" id="totpToken" value={totpToken} onChange={(e) => setTotpToken(e.target.value)} disabled={loading} />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Verify'}
                </Button>
            </Box>
        )}
      </Paper>
    </Container>
  );
};

export default LoginPage;
