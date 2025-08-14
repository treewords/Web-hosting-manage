const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const Email = require('../models/Email');
const Domain = require('../models/Domain'); // To verify domain ownership

// A helper middleware to check if the user owns the domain
const checkDomainOwnership = async (req, res, next) => {
    try {
        const domainId = req.query.domainId || req.body.domainId;
        if (!domainId) {
            return res.status(400).json({ msg: 'Domain ID is required' });
        }

        const domains = await Domain.findByUserId(req.user.id);
        const domain = domains.find(d => d.id === parseInt(domainId));

        if (!domain) {
            return res.status(403).json({ msg: 'Forbidden: You do not own this domain' });
        }

        req.domain = domain; // Pass domain to next middleware
        next();
    } catch (error) {
        res.status(500).send('Server Error in domain ownership check');
    }
};


// @route   POST /api/email/accounts
// @desc    Create a new email account
// @access  Private
router.post('/accounts', [authMiddleware, checkDomainOwnership, [
    body('localPart', 'Local part (e.g., "info") is required').not().isEmpty(),
    body('password', 'Password is required').isLength({ min: 8 })
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { localPart, password } = req.body;
    const domainId = req.domain.id;
    const domainName = req.domain.domain_name;
    const email = `${localPart}@${domainName}`;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAccount = await Email.addAccount(domainId, email, hashedPassword);
        res.status(201).json(newAccount);
    } catch (err) {
        console.error(err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ msg: 'Email address already exists.' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/email/accounts
// @desc    Get all email accounts for a domain
// @access  Private
router.get('/accounts', [authMiddleware, checkDomainOwnership], async (req, res) => {
    try {
        const accounts = await Email.listAccountsByDomain(req.domain.id);
        res.json(accounts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/email/accounts/:id
// @desc    Delete an email account
// @access  Private
router.delete('/accounts/:id', [authMiddleware, checkDomainOwnership], async (req, res) => {
    try {
        const deletedCount = await Email.deleteAccount(req.params.id, req.domain.id);
        if (deletedCount === 0) {
            return res.status(404).json({ msg: 'Account not found on this domain.' });
        }
        res.json({ msg: 'Email account deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
