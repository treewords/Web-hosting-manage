import React, { useState, useEffect, useCallback } from 'react';
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
  TextField
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
      // Sort folders first, then files
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

  const handleDownload = (filePath) => {
    // This is tricky without a form submit, we can use a link
    const downloadUrl = `/api/files/download?path=${encodeURIComponent(filePath)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    // We need to add the auth token for the download link if it's not cookie-based
    // For simplicity, we'll assume the browser sends cookies if the API is on the same domain.
    // A more robust solution might need a temporary token in the URL.
    // Or, fetch the blob and create a URL:
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

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(p => p);
    let pathAccumulator = '';

    return (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
            <Link component="button" onClick={() => handlePathChange('/')} underline="hover" color="inherit">
                Home
            </Link>
            {pathParts.map((part, index) => {
                pathAccumulator += `/${part}`;
                const linkPath = pathAccumulator; // Capture path at this iteration
                return (
                    <Link
                        key={index}
                        component="button"
                        onClick={() => handlePathChange(linkPath)}
                        underline="hover"
                        color="inherit"
                    >
                        {part}
                    </Link>
                );
            })}
        </Breadcrumbs>
    );
  };


  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        File Manager
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        {renderBreadcrumbs()}
      </Paper>

      {/* Action buttons */}
      <Box sx={{ mb: 2 }}>
        <Button variant="contained">Upload File</Button>
        <Button sx={{ ml: 1 }} variant="outlined">New Folder</Button>
      </Box>

      {/* Contents List */}
      <Paper sx={{ p: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
        ) : (
          <List>
            {contents.map((item) => (
              <ListItem
                key={item.name}
                secondaryAction={
                  <>
                    {!item.isDirectory && (
                      <IconButton edge="end" aria-label="download" onClick={() => handleDownload(`${currentPath}/${item.name}`.replace('//', '/'))}>
                        <DownloadIcon />
                      </IconButton>
                    )}
                    <IconButton edge="end" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemIcon>
                  {item.isDirectory ? <FolderIcon /> : <InsertDriveFileIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    item.isDirectory ? (
                      <Link component="button" onClick={() => handlePathChange(`${currentPath}/${item.name}`.replace('//', '/'))} underline="hover">
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )
                  }
                  secondary={`${item.size} bytes`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default FileManagerPage;
