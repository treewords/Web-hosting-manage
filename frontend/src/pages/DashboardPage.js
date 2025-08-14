import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Container,
  Paper,
  Box,
  Button,
  Grid,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const StatWidget = ({ title, value, total, unit }) => (
    <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
        <Typography variant="h4" component="div" gutterBottom>
            {value}
            <Typography variant="h6" component="span" color="text.secondary">
                {total ? ` / ${total} ${unit}` : ` ${unit}`}
            </Typography>
        </Typography>
        {total && (
            <LinearProgress
                variant="determinate"
                value={(parseFloat(value) / parseFloat(total)) * 100}
            />
        )}
    </Paper>
);


const DashboardPage = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const api = axios.create({
      baseURL: '/api',
      headers: { 'x-auth-token': token }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/system/stats');
        setStats(res.data);
      } catch (err) {
        setError('Could not load system stats. The backend might not have required permissions.');
        console.error(err);
      }
    };

    fetchStats(); // Fetch initial stats
    const intervalId = setInterval(fetchStats, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [token]); // api instance depends on token

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4">
                Hi, Welcome back {user ? `, ${user.email}` : ''}! 👋
            </Typography>
            <Button variant="contained" color="error" onClick={handleLogout}>
                Logout
            </Button>
        </Box>

        {error && <Alert severity="warning" sx={{mb: 2}}>{error}</Alert>}

        {!stats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
            </Box>
        ) : (
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <StatWidget
                        title="CPU Load"
                        value={stats.cpu.currentLoad}
                        unit="%"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatWidget
                        title="Memory Usage"
                        value={formatBytes(stats.memory.used)}
                        total={formatBytes(stats.memory.total)}
                        unit=""
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatWidget
                        title="Disk Usage"
                        value={formatBytes(stats.disk.used)}
                        total={formatBytes(stats.disk.total)}
                        unit=""
                    />
                </Grid>
            </Grid>
        )}
    </Container>
  );
};

export default DashboardPage;
