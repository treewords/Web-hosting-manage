const express = require('express');
const fs = require('fs').promises;
const path = require('path');
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
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validare simplă
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }

  try {
    // Verificăm dacă utilizatorul există
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Comparăm parolele
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Creăm și semnăm token-ul JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
