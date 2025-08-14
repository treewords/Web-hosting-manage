const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const db = require('../config/db');

// @route   GET /api/admin/users
// @desc    Get all users in the system
// @access  Private (Admin only)
router.get('/users', [authMiddleware, checkRole(['admin'])], async (req, res) => {
    try {
        const sql = 'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC';
        const [users] = await db.execute(sql);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Future admin routes can be added here, e.g., for deleting users, suspending accounts, etc.

module.exports = router;
