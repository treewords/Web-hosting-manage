import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const FileManagerPage = () => {
  const [contents, setContents] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for dialogs
  const [openNewFolderDialog, setOpenNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Ref for file input
  const fileInputRef = useRef(null);

  const { token } = useAuth();
  const api = axios.create({
      baseURL: '/api',
      headers: { 'x-auth-token': token }
  });

  const fetchContents = useCallback(async (path) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/files?path=${encodeURIComponent(path)}`);
      const sortedContents = res.data.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      setContents(sortedContents);
      setCurrentPath(path);
    } catch (err) {
      setError('Failed to fetch contents.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]); // api instance depends on token

  useEffect(() => {
    fetchContents(currentPath);
  }, [fetchContents, currentPath]);

  const handlePathChange = (newPath) => {
    fetchContents(newPath);
  };

  const handleDelete = async (itemPath) => {
      if (window.confirm(`Are you sure you want to delete "${itemPath}"?`)) {
          try {
              await api.delete(`/files?path=${encodeURIComponent(itemPath)}`);
              // Refresh contents
              fetchContents(currentPath);
          } catch (err) {
              setError(`Failed to delete ${itemPath}.`);
              console.error(err);
          }
      }
  };

  const handleDownload = (filePath) => {
    const downloadUrl = `/api/files/download?path=${encodeURIComponent(filePath)}`;
    api.get(downloadUrl, { responseType: 'blob' }).then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = filePath.split('/').pop();
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    }).catch(e => console.error("Download error", e));
  };

  const handleCreateFolder = async () => {
      if (!newFolderName) return;
      try {
          const newFolderPath = `${currentPath}/${newFolderName}`.replace('//', '/');
          await api.post('/files/create-folder', { newFolderPath });
          setOpenNewFolderDialog(false);
          setNewFolderName('');
          fetchContents(currentPath); // Refresh
      } catch (err) {
          console.error(err);
          // You could set a dialog-specific error state here
      }
  };

  const handleUploadClick = () => {
      fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
      const files = event.target.files;
      if (files.length === 0) return;

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
      }
      formData.append('path', currentPath);

      try {
          // You might want to add a loading indicator for uploads
          await api.post('/files/upload', formData, {
              headers: {
                  'Content-Type': 'multipart/form-data'
              }
          });
          fetchContents(currentPath); // Refresh
      } catch (err) {
          setError('File upload failed.');
          console.error(err);
      }
  };

  const renderBreadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(p => p);
    let pathAccumulator = '';

    return (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
            <Link component="button" onClick={() => handlePathChange('/')} underline="hover" color="inherit">Home</Link>
            {pathParts.map((part, index) => {
                pathAccumulator += `/${part}`;
                const linkPath = pathAccumulator;
                return (<Link key={index} component="button" onClick={() => handlePathChange(linkPath)} underline="hover" color="inherit">{part}</Link>);
            })}
        </Breadcrumbs>
    );
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>File Manager</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>{renderBreadcrumbs()}</Paper>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={handleUploadClick}>Upload File</Button>
        <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <Button sx={{ ml: 1 }} variant="outlined" onClick={() => setOpenNewFolderDialog(true)}>New Folder</Button>
      </Box>
      <Paper sx={{ p: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
        ) : (
          <List>
            {contents.map((item) => {
              const itemPath = `${currentPath}/${item.name}`.replace('//', '/');
              return (
              <ListItem key={item.name} secondaryAction={
                  <>
                    {!item.isDirectory && (<IconButton edge="end" onClick={() => handleDownload(itemPath)}><DownloadIcon /></IconButton>)}
                    <IconButton edge="end" onClick={() => handleDelete(itemPath)}><DeleteIcon /></IconButton>
                  </>
                }
              >
                <ListItemIcon>{item.isDirectory ? <FolderIcon /> : <InsertDriveFileIcon />}</ListItemIcon>
                <ListItemText primary={item.isDirectory ? (<Link component="button" onClick={() => handlePathChange(itemPath)} underline="hover">{item.name}</Link>) : (item.name)} secondary={`${item.size} bytes`} />
              </ListItem>
            )})}
          </List>
        )}
      </Paper>

      {/* New Folder Dialog */}
      <Dialog open={openNewFolderDialog} onClose={() => setOpenNewFolderDialog(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent><DialogContentText>Enter the name for the new folder.</DialogContentText>
          <TextField autoFocus margin="dense" id="name" label="Folder Name" type="text" fullWidth variant="standard" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewFolderDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder}>Create</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FileManagerPage;
