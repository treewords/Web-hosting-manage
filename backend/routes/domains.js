const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const Domain = require('../models/Domain');

// @route   GET api/domains
// @desc    Get all domains for a user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const domains = await Domain.findByUserId(req.user.id);
        res.json(domains);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/domains
// @desc    Add a new domain
// @access  Private
router.post(
    '/',
    [
        authMiddleware,
        [
            body('domain_name', 'Please include a valid domain name').not().isEmpty(),
            // Basic validation for domain format
            body('domain_name').matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i)
                .withMessage('Domain name format is invalid.'),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { domain_name } = req.body;

        try {
            const newDomain = await Domain.create(req.user.id, domain_name);
            res.status(201).json(newDomain);
        } catch (err) {
            if (err.statusCode === 409) {
                return res.status(409).json({ msg: err.message });
            }
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/domains/:id
// @desc    Delete a domain
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedCount = await Domain.delete(req.params.id, req.user.id);

        if (deletedCount === 0) {
            return res.status(404).json({ msg: 'Domain not found or you do not own this domain' });
        }

        res.json({ msg: 'Domain removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
