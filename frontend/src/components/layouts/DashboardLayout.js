import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';

const DashboardLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* Aici va veni un Sidebar permanent */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            WebPanel
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Aici va veni un Drawer (meniul lateral) */}

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {/* Conținutul principal al paginii (DashboardPage, etc.) */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
