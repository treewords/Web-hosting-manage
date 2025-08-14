import React from 'react';
import { Typography, Container, Paper, Box } from '@mui/material';

const DashboardPage = () => {
  return (
    <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 5 }}>
            Hi, Welcome back 👋
        </Typography>
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
