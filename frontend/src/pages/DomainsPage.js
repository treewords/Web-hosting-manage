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
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext'; // Assuming axios is configured here
import axios from 'axios'; // Or use a pre-configured instance

const DomainsPage = () => {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // We need the token for API calls, let's get it from our context
  const { token } = useAuth();

  // Create an axios instance with the auth token
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
    } catch (err) {
      setError('Failed to fetch domains. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]); // Dependency on token ensures api instance is fresh

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAddDomain = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newDomain) {
        setFormError('Domain name cannot be empty.');
        return;
    }
    try {
      const res = await api.post('/domains', { domain_name: newDomain });
      setDomains([res.data, ...domains]);
      setNewDomain('');
    } catch (err) {
      setFormError(err.response?.data?.msg || err.response?.data?.errors[0]?.msg || 'Failed to add domain.');
      console.error(err);
    }
  };

  const handleDeleteDomain = async (id) => {
    if (window.confirm('Are you sure you want to delete this domain?')) {
        try {
          await api.delete(`/domains/${id}`);
          setDomains(domains.filter((domain) => domain.id !== id));
        } catch (err) {
          setError('Failed to delete domain.');
          console.error(err);
        }
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mb: 4 }}>
        Domain Management
      </Typography>

      {/* Add Domain Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Add New Domain</Typography>
        <Box component="form" onSubmit={handleAddDomain} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            error={!!formError}
            helperText={formError}
          />
          <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
            Add Domain
          </Button>
        </Box>
      </Paper>

      {/* Domains List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Your Domains</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {domains.length > 0 ? (
              domains.map((domain) => (
                <ListItem
                  key={domain.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDomain(domain.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={domain.domain_name}
                    secondary={`Added on: ${new Date(domain.created_at).toLocaleDateString()}`}
                  />
                </ListItem>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
                You haven't added any domains yet.
              </Typography>
            )}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default DomainsPage;
