const db = require('../config/db');

const User = {};

// Create a new user in the database
User.create = async (email, password, role) => {
  const sql = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
  try {
    const [result] = await db.execute(sql, [email, password, role]);
    // Return the newly created user's info
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
    return rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Find a user by their email address
User.findByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  try {
    const [rows] = await db.execute(sql, [email]);
    return rows[0]; // Returns the user object or undefined if not found
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Find a user by their ID
User.findById = async (id) => {
  const sql = 'SELECT id, email, role, created_at FROM users WHERE id = ?';
  try {
    const [rows] = await db.execute(sql, [id]);
    return rows[0];
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

// IMPORTANT: We need a way to create the 'users' table.
// For now, we assume it exists. Later, we can add a migration script.
/*
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('client', 'reseller', 'admin') NOT NULL DEFAULT 'client',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
*/

module.exports = User;
