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
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const EmailPage = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({ localPart: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const { token } = useAuth();
  const api = axios.create({
      baseURL: '/api',
      headers: { 'x-auth-token': token }
  });

  // Fetch user's domains to populate the dropdown
  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/domains');
      setDomains(res.data);
      if (res.data.length > 0) {
        setSelectedDomain(res.data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch domains.');
    } finally {
      setLoading(false);
    }
  }, [token]); // api instance depends on token

  // Fetch email accounts when a domain is selected
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!selectedDomain) return;
      try {
        setLoading(true);
        const res = await api.get(`/email/accounts?domainId=${selectedDomain}`);
        setAccounts(res.data);
      } catch (err) {
        setError('Failed to fetch email accounts for this domain.');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [selectedDomain, token]); // api instance depends on token

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newAccount.localPart || !newAccount.password) {
        setFormError('Both fields are required.');
        return;
    }
    try {
        const res = await api.post('/email/accounts', {
            domainId: selectedDomain,
            localPart: newAccount.localPart,
            password: newAccount.password
        });
        setAccounts([...accounts, res.data]);
        setNewAccount({ localPart: '', password: '' });
    } catch (err) {
        setFormError(err.response?.data?.msg || 'Failed to create account.');
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this email account?')) {
        try {
            await api.delete(`/email/accounts/${accountId}?domainId=${selectedDomain}`);
            setAccounts(accounts.filter(acc => acc.id !== accountId));
        } catch (err) {
            setError('Failed to delete account.');
        }
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mb: 4 }}>Email Account Management</Typography>

      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel id="domain-select-label">Domain</InputLabel>
        <Select
          labelId="domain-select-label"
          value={selectedDomain}
          label="Domain"
          onChange={(e) => setSelectedDomain(e.target.value)}
          disabled={loading || domains.length === 0}
        >
          {domains.map(d => <MenuItem key={d.id} value={d.id}>{d.domain_name}</MenuItem>)}
        </Select>
      </FormControl>

      {/* Add Account Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Create New Email Account</Typography>
        <Box component="form" onSubmit={handleAddAccount} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField variant="outlined" label="Username" value={newAccount.localPart} onChange={e => setNewAccount({...newAccount, localPart: e.target.value})} />
          <Typography sx={{pt:2}}>@{domains.find(d => d.id === selectedDomain)?.domain_name}</Typography>
          <TextField variant="outlined" label="Password" type="password" value={newAccount.password} onChange={e => setNewAccount({...newAccount, password: e.target.value})} />
          <Button type="submit" variant="contained">Create</Button>
        </Box>
        {formError && <Alert severity="error" sx={{mt: 2}}>{formError}</Alert>}
      </Paper>

      {/* Accounts List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Email Accounts</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
        ) : (
          <List>
            {accounts.length > 0 ? (
              accounts.map((acc) => (
                <ListItem key={acc.id} secondaryAction={<IconButton edge="end" onClick={() => handleDeleteAccount(acc.id)}><DeleteIcon /></IconButton>}>
                  <ListItemText primary={acc.email} />
                </ListItem>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>No email accounts for this domain.</Typography>
            )}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default EmailPage;
