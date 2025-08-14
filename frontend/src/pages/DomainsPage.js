import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HttpsIcon from '@mui/icons-material/Https';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const DomainsPage = () => {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [sslStatus, setSslStatus] = useState({}); // e.g., { domainId: 'issuing' | 'success' | 'error' }

  const { token } = useAuth();
  const api = axios.create({
      baseURL: '/api',
      headers: { 'x-auth-token': token }
  });

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/domains');
      setDomains(res.data);
      // Here you might also fetch initial SSL status for all domains
    } catch (err) {
      setError('Failed to fetch domains. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [token]); // api instance depends on token

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAddDomain = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newDomain) return;
    try {
      const res = await api.post('/domains', { domain_name: newDomain });
      setDomains([res.data, ...domains]);
      setNewDomain('');
    } catch (err) {
      setFormError(err.response?.data?.msg || err.response?.data?.errors[0]?.msg || 'Failed to add domain.');
    }
  };

  const handleDeleteDomain = async (id) => {
    if (window.confirm('Are you sure you want to delete this domain?')) {
        try {
          await api.delete(`/domains/${id}`);
          setDomains(domains.filter((domain) => domain.id !== id));
        } catch (err) {
          setError('Failed to delete domain.');
        }
    }
  };

  const handleIssueSsl = async (domainId, domainName) => {
    setSslStatus(prev => ({ ...prev, [domainId]: 'issuing' }));
    try {
        await api.post('/ssl/issue', { domainName });
        setSslStatus(prev => ({ ...prev, [domainId]: 'success' }));
    } catch (error) {
        console.error("SSL Issue Error:", error.response?.data);
        setSslStatus(prev => ({ ...prev, [domainId]: 'error' }));
    }
  };

  const renderSslButton = (domain) => {
      const status = sslStatus[domain.id];
      if (status === 'issuing') {
          return <CircularProgress size={24} />;
      }
      if (status === 'success') {
          return <HttpsIcon color="success" />;
      }
      if (status === 'error') {
        return <Tooltip title="Failed to issue SSL. Check logs."><LockOpenIcon color="error" /></Tooltip>;
      }
      // In a real app, you'd check if a cert already exists.
      // For now, we assume none exist initially.
      return (
        <Button size="small" variant="outlined" onClick={() => handleIssueSsl(domain.id, domain.domain_name)}>
            Issue SSL
        </Button>
      );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mb: 4 }}>Domain Management</Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Add New Domain</Typography>
        <Box component="form" onSubmit={handleAddDomain} sx={{ display: 'flex', gap: 2 }}>
          <TextField fullWidth variant="outlined" label="example.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} error={!!formError} helperText={formError} />
          <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>Add Domain</Button>
        </Box>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Your Domains</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
        ) : (
          <List>
            {domains.length > 0 ? (
              domains.map((domain) => (
                <ListItem key={domain.id}>
                  <ListItemIcon>{renderSslButton(domain)}</ListItemIcon>
                  <ListItemText primary={domain.domain_name} secondary={`Added on: ${new Date(domain.created_at).toLocaleDateString()}`} />
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDomain(domain.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>You haven't added any domains yet.</Typography>
            )}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default DomainsPage;
