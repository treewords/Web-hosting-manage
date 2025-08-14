import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Paper, Box, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
            <Typography variant="h4">
                Hi, Welcome back {user ? `, ${user.email}` : ''}! 👋
            </Typography>
            <Button variant="contained" color="error" onClick={handleLogout}>
                Logout
            </Button>
        </Box>
        <Paper sx={{ p: 3 }}>
            <Box>
                <Typography variant="h6">
                    Main Dashboard
                </Typography>
                <Typography>
                    This is a protected area. You are successfully logged in.
                </Typography>
                <Typography sx={{ mt: 2 }}>
                    Future components like Domain Management, Database Management, and Resource Monitoring will be displayed here.
                </Typography>
            </Box>
        </Paper>
    </Container>
  );
};

export default DashboardPage;
