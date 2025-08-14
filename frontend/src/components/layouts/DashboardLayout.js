import React from 'react';
import { Outlet, NavLink as RouterLink } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LanguageIcon from '@mui/icons-material/Language';
import StorageIcon from '@mui/icons-material/Storage';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const allNavItems = [
    { text: 'Dashboard', path: '/', icon: <HomeIcon />, roles: ['client', 'reseller', 'admin'] },
    { text: 'Domains', path: '/domains', icon: <LanguageIcon />, roles: ['client', 'reseller', 'admin'] },
    { text: 'MySQL', path: '/mysql', icon: <StorageIcon />, roles: ['client', 'reseller', 'admin'] },
    { text: 'File Manager', path: '/files', icon: <FolderOpenIcon />, roles: ['client', 'reseller', 'admin'] },
    { text: 'Admin', path: '/admin', icon: <AdminPanelSettingsIcon />, roles: ['admin'] },
];

const DashboardLayout = () => {
  const { user } = useAuth();

  // Filter navigation items based on user role
  const visibleNavItems = allNavItems.filter(item => user && item.roles.includes(user.role));

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            WebPanel <Typography variant="caption" sx={{ml: 1}}>({user?.role})</Typography>
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
            {visibleNavItems.map((item) => (
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
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
