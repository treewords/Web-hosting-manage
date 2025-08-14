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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const MysqlPage = () => {
  const [databases, setDatabases] = useState([]);
  const [nameSuffix, setNameSuffix] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [newDbInfo, setNewDbInfo] = useState(null); // To show generated password

  const { token } = useAuth();
  const api = axios.create({
      baseURL: '/api',
      headers: { 'x-auth-token': token }
  });

  const fetchDatabases = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/mysql/databases');
      setDatabases(res.data);
    } catch (err) {
      setError('Failed to fetch databases.');
    } finally {
      setLoading(false);
    }
  }, [token]); // api instance depends on token

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const handleAddDatabase = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!nameSuffix) {
        setFormError('Database name suffix cannot be empty.');
        return;
    }
    try {
      const res = await api.post('/mysql/databases', { name_suffix: nameSuffix });
      setDatabases([res.data, ...databases]);
      setNewDbInfo(res.data); // Save new DB info to show password
      setNameSuffix('');
    } catch (err) {
      setFormError(err.response?.data?.errors[0]?.msg || 'Failed to add database.');
    }
  };

  const handleDeleteDatabase = async (id) => {
    if (window.confirm('Are you sure? This will permanently delete the database and its user.')) {
        try {
          await api.delete(`/mysql/databases/${id}`);
          setDatabases(databases.filter((db) => db.id !== id));
        } catch (err) {
          setError('Failed to delete database.');
        }
    }
  };

  const handleCloseDialog = () => {
    setNewDbInfo(null);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mb: 4 }}>
        MySQL Database Management
      </Typography>

      {/* Add DB Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Create New Database</Typography>
        <Box component="form" onSubmit={handleAddDatabase} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Database Name Suffix"
            helperText="A prefix will be added automatically (e.g., user1_)"
            value={nameSuffix}
            onChange={(e) => setNameSuffix(e.target.value)}
            error={!!formError}
          />
          <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
            Create Database
          </Button>
        </Box>
        {formError && <Alert severity="error" sx={{mt: 2}}>{formError}</Alert>}
      </Paper>

      {/* DB List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Your Databases</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
        ) : (
          <List>
            {databases.length > 0 ? (
              databases.map((db) => (
                <ListItem
                  key={db.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDatabase(db.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={db.db_name}
                    secondary={`User: ${db.db_user}`}
                  />
                </ListItem>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
                You haven't created any databases yet.
              </Typography>
            )}
          </List>
        )}
      </Paper>

      {/* Password Dialog */}
      <Dialog open={!!newDbInfo} onClose={handleCloseDialog}>
        <DialogTitle>Database Created Successfully!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please save the following credentials. The password is shown only once.
          </DialogContentText>
          <Box sx={{mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, background: '#f9f9f9'}}>
            <Typography><strong>Database Name:</strong> {newDbInfo?.db_name}</Typography>
            <Typography><strong>Username:</strong> {newDbInfo?.db_user}</Typography>
            <Typography><strong>Password:</strong> {newDbInfo?.password}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MysqlPage;
