const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db');

// @route   POST /api/security/2fa/generate
// @desc    Generate a new 2FA secret for the user
// @access  Private
router.post('/2fa/generate', authMiddleware, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `WebPanel (${req.user.email})` // App name as it will appear in authenticator
        });

        // Save the ASCII secret to the user record
        await db.execute('UPDATE users SET two_factor_secret = ? WHERE id = ?', [secret.ascii, req.user.id]);

        // Generate a QR code for the user to scan
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                throw err;
            }
            res.json({
                secret: secret.base32, // For manual entry
                qrCodeUrl: data_url
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/security/2fa/verify
// @desc    Verify a 2FA token and enable 2FA
// @access  Private
router.post('/2fa/verify', authMiddleware, async (req, res) => {
    const { token } = req.body;

    try {
        const [rows] = await db.execute('SELECT two_factor_secret FROM users WHERE id = ?', [req.user.id]);
        const user = rows[0];

        if (!user || !user.two_factor_secret) {
            return res.status(400).json({ msg: '2FA secret not found. Please generate one first.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'ascii',
            token: token
        });

        if (verified) {
            // Enable 2FA for the user
            await db.execute('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [req.user.id]);
            res.json({ msg: '2FA has been enabled successfully.' });
        } else {
            res.status(400).json({ msg: 'Invalid 2FA token.' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/security/2fa/disable
// @desc    Disable 2FA for the user
// @access  Private
router.post('/2fa/disable', authMiddleware, async (req, res) => {
    try {
        // For simplicity, we allow disabling without a token.
        // A more secure app would require the current password or a 2FA token to disable.
        await db.execute('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?', [req.user.id]);
        res.json({ msg: '2FA has been disabled.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
