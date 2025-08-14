const db = require('../config/db');

const Domain = {};

// Get all domains for a specific user
Domain.findByUserId = async (userId) => {
  const sql = 'SELECT id, domain_name, created_at FROM domains WHERE user_id = ? ORDER BY created_at DESC';
  try {
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  } catch (error) {
    console.error('Error finding domains by user ID:', error);
    throw error;
  }
};

// Create a new domain for a user
Domain.create = async (userId, domainName) => {
  const sql = 'INSERT INTO domains (user_id, domain_name) VALUES (?, ?)';
  try {
    const [result] = await db.execute(sql, [userId, domainName]);
    const [rows] = await db.execute('SELECT * FROM domains WHERE id = ?', [result.insertId]);
    return rows[0];
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'ER_DUP_ENTRY') {
        const err = new Error('Domain already exists for this user.');
        err.statusCode = 409; // Conflict
        throw err;
    }
    console.error('Error creating domain:', error);
    throw error;
  }
};

// Delete a domain by its ID, ensuring it belongs to the user
Domain.delete = async (domainId, userId) => {
  const sql = 'DELETE FROM domains WHERE id = ? AND user_id = ?';
  try {
    const [result] = await db.execute(sql, [domainId, userId]);
    return result.affectedRows; // Returns 1 if deleted, 0 if not found or not owned by user
  } catch (error) {
    console.error('Error deleting domain:', error);
    throw error;
  }
};

module.exports = Domain;
