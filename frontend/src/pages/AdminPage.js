import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { token } = useAuth();
  const api = axios.create({
      baseURL: '/api',
      headers: { 'x-auth-token': token }
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]); // api instance depends on token

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'reseller':
        return 'warning';
      case 'client':
      default:
        return 'primary';
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 4 }}>
        Admin Panel - User Management
      </Typography>

      <Paper sx={{ p: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Registered On</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Chip label={user.role} color={getRoleChipColor(user.role)} size="small" />
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default AdminPage;
