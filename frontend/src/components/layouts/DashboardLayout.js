import React from 'react';
import { Outlet, NavLink as RouterLink } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LanguageIcon from '@mui/icons-material/Language';

const drawerWidth = 240;

const navItems = [
    { text: 'Dashboard', path: '/', icon: <HomeIcon /> },
    { text: 'Domains', path: '/domains', icon: <LanguageIcon /> },
];

const DashboardLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            WebPanel
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={RouterLink} to={item.path}
                  style={({ isActive }) => {
                    return {
                      backgroundColor: isActive ? 'rgba(0, 0, 0, 0.08)' : '',
                    };
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: '64px' }}>
        {/* Conținutul principal al paginii (DashboardPage, etc.) */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
