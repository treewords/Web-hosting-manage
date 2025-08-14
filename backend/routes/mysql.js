const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const MysqlDatabase = require('../models/MysqlDatabase');

// Helper to generate random strings
const generateRandomString = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

// @route   GET api/mysql/databases
// @desc    Get all tracked MySQL databases for a user
// @access  Private
router.get('/databases', authMiddleware, async (req, res) => {
    try {
        const databases = await MysqlDatabase.listByUserId(req.user.id);
        res.json(databases);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/mysql/databases
// @desc    Create a new MySQL database and user
// @access  Private
router.post(
    '/databases',
    [
        authMiddleware,
        [
            // Prefix user ID to db/user names to ensure uniqueness and prevent collisions
            // Validation for the suffix provided by the user
            body('name_suffix', 'Database name suffix must be alphanumeric and between 3 to 10 chars')
                .isAlphanumeric().isLength({ min: 3, max: 10 }),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name_suffix } = req.body;
        const userId = req.user.id;

        // Construct names with a prefix to avoid collisions and identify ownership
        const dbName = `user${userId}_${name_suffix}`;
        const dbUser = `user${userId}_${name_suffix}`;
        const dbPassword = generateRandomString(16); // Generate a secure password

        try {
            const newDb = await MysqlDatabase.create(userId, dbName, dbUser, dbPassword);
            res.status(201).json({
                ...newDb,
                // IMPORTANT: Return the password to the user ONCE upon creation.
                // It will not be stored in our tracking database.
                password: dbPassword,
                message: "Database and user created successfully. Please save the password, it will not be shown again."
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error: ' + err.message);
        }
    }
);

// @route   DELETE api/mysql/databases/:id
// @desc    Delete a MySQL database and user
// @access  Private
router.delete('/databases/:id', authMiddleware, async (req, res) => {
    try {
        const deletedCount = await MysqlDatabase.delete(req.params.id, req.user.id);

        if (deletedCount === 0) {
            return res.status(404).json({ msg: 'Database not found or you do not own this database' });
        }

        res.json({ msg: 'Database and user removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
