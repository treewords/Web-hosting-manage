const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { getSafePath, listDirectoryContents } = require('../utils/fileManager');

// --- Multer Configuration for File Uploads ---
// We configure multer to store files temporarily without a specific destination,
// as we will move them to the correct user directory ourselves.
const upload = multer({ dest: '/tmp/webpanel_uploads/' });


// @route   GET /api/files
// @desc    List files and folders in a directory
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userPath = req.query.path || '/';
        const safePath = getSafePath(req.user.id, userPath);
        const contents = await listDirectoryContents(safePath);
        res.json(contents);
    } catch (error) {
        console.error(error.message);
        if (error.message.startsWith('Forbidden')) {
            return res.status(403).send(error.message);
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/files/upload
// @desc    Upload one or more files
// @access  Private
router.post('/upload', [authMiddleware, upload.array('files')], async (req, res) => {
    try {
        const userPath = req.body.path || '/';
        const destinationDir = getSafePath(req.user.id, userPath);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'No files were uploaded.' });
        }

        for (const file of req.files) {
            const finalPath = path.join(destinationDir, file.originalname);
            await fs.rename(file.path, finalPath);
        }

        res.json({ msg: `${req.files.length} files uploaded successfully.` });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error: ' + error.message);
    }
});


// @route   GET /api/files/download
// @desc    Download a file
// @access  Private
router.get('/download', authMiddleware, async (req, res) => {
    try {
        const userPath = req.query.path;
        if (!userPath) {
            return res.status(400).json({ msg: 'File path is required.' });
        }
        const safeFilePath = getSafePath(req.user.id, userPath);

        // Ensure it's a file, not a directory
        const stats = await fs.stat(safeFilePath);
        if (stats.isDirectory()) {
            return res.status(400).json({ msg: 'Cannot download a directory.' });
        }

        res.download(safeFilePath);
    } catch (error) {
        console.error(error.message);
        if (error.code === 'ENOENT') {
            return res.status(404).send('File not found.');
        }
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/files/create-folder
// @desc    Create a new folder
// @access  Private
router.post('/create-folder', authMiddleware, async (req, res) => {
    try {
        const { newFolderPath } = req.body;
        if (!newFolderPath) {
            return res.status(400).json({ msg: 'Folder path is required.' });
        }
        const safePath = getSafePath(req.user.id, newFolderPath);
        await fs.mkdir(safePath, { recursive: true });
        res.status(201).json({ msg: 'Folder created successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error: ' + error.message);
    }
});


// @route   DELETE /api/files
// @desc    Delete a file or folder
// @access  Private
router.delete('/', authMiddleware, async (req, res) => {
    try {
        const userPath = req.query.path;
        if (!userPath) {
            return res.status(400).json({ msg: 'File or folder path is required.' });
        }
        const safePath = getSafePath(req.user.id, userPath);

        // Use recursive force delete to handle non-empty directories
        await fs.rm(safePath, { recursive: true, force: true });

        res.json({ msg: 'File or folder deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error: ' + error.message);
    }
});


module.exports = router;
