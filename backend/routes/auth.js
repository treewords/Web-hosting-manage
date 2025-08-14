const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const User = require('../models/User'); // Vom crea acest model imediat

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  // Validare simplă
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Verificăm dacă utilizatorul există deja
    let user = await User.findByEmail(email);
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Criptăm parola
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Setăm rolul. Implicit 'client' dacă nu este specificat
    const userRole = role || 'client';

    // Creăm utilizatorul
    const newUser = await User.create(email, hashedPassword, userRole);

    // Create a home directory for the new user
    const userHomeDir = path.join('/var/www/hosts', `user_${newUser.id}`);
    await fs.mkdir(userHomeDir, { recursive: true });

    res.status(201).json({
      msg: 'User registered successfully',
      userId: newUser.id,
      email: newUser.email,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// @route   POST /api/auth/login
// @desc    Authenticate user & get token (Step 1)
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // --- 2FA Check ---
        if (user.two_factor_enabled) {
            // User has 2FA enabled, issue a temporary challenge token
            const challengePayload = { userId: user.id };
            const challengeToken = jwt.sign(challengePayload, process.env.JWT_SECRET, { expiresIn: '5m' });
            return res.json({ twoFactorRequired: true, challengeToken });
        }

        // --- No 2FA, issue final token ---
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/login/2fa
// @desc    Verify 2FA token and get final JWT (Step 2)
// @access  Public (but requires challenge token)
router.post('/login/2fa', async (req, res) => {
    const { challengeToken, totpToken } = req.body;

    if (!challengeToken || !totpToken) {
        return res.status(400).json({ msg: 'Challenge token and 2FA token are required.' });
    }

    try {
        // Verify the temporary challenge token
        const decodedChallenge = jwt.verify(challengeToken, process.env.JWT_SECRET);
        const userId = decodedChallenge.userId;

        // Get user's 2FA secret
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
            return res.status(401).json({ msg: '2FA is not enabled for this user or secret not found.' });
        }

        // Verify the TOTP token
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'ascii',
            token: totpToken,
            window: 1 // Allow for a 30-second window of drift
        });

        if (!verified) {
            return res.status(400).json({ msg: 'Invalid 2FA token.' });
        }

        // --- 2FA successful, issue final token ---
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Invalid or expired challenge token.' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/request-password-reset
// @desc    Request a password reset link/token
// @access  Public
router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);

        if (!user) {
            // Don't reveal if user exists or not, for security
            return res.json({ msg: 'If a user with that email exists, a password reset link has been sent.' });
        }

        // Create a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token expiry to 1 hour from now
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Save hashed token and expiry to user record
        await db.execute('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [hashedToken, tokenExpiry, user.id]);

        // In a real app, you would email this link:
        // const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        // console.log(`Password reset link: ${resetUrl}`);
        // For this simulation, we just return success.

        res.json({ msg: 'If a user with that email exists, a password reset link has been sent.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using a token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user by hashed token and check expiry
        const [rows] = await db.execute('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [hashedToken]);
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ msg: 'Token is invalid or has expired.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token fields
        await db.execute('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, user.id]);

        res.json({ msg: 'Password has been reset successfully.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
