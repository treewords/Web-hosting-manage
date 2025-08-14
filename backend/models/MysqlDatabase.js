const db = require('../config/db'); // Standard pool for tracking table
const createAdminConnection = require('../config/db_admin');

const MysqlDatabase = {};

// List tracked databases for a user
MysqlDatabase.listByUserId = async (userId) => {
  const sql = 'SELECT id, db_name, db_user, created_at FROM mysql_databases WHERE user_id = ? ORDER BY created_at DESC';
  try {
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  } catch (error) {
    console.error('Error listing MySQL databases:', error);
    throw error;
  }
};

// Create a new MySQL database and user
MysqlDatabase.create = async (userId, dbName, dbUser, dbPassword) => {
  const adminDb = createAdminConnection();
  try {
    // Step 1: Execute privileged commands
    await adminDb.execute(`CREATE DATABASE \`${dbName}\``);
    await adminDb.execute(`CREATE USER \`${dbUser}\`@'%' IDENTIFIED BY ?`, [dbPassword]);
    await adminDb.execute(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO \`${dbUser}\`@'%'`);
    await adminDb.execute('FLUSH PRIVILEGES');
    console.log(`Successfully created DB ${dbName} and USER ${dbUser}`);

    // Step 2: Track the new database in our panel's DB
    const trackSql = 'INSERT INTO mysql_databases (user_id, db_name, db_user) VALUES (?, ?, ?)';
    const [result] = await db.execute(trackSql, [userId, dbName, dbUser]);

    const [rows] = await db.execute('SELECT * FROM mysql_databases WHERE id = ?', [result.insertId]);
    return rows[0];

  } catch (error) {
    console.error('Error creating MySQL database:', error);
    // Attempt to clean up if something went wrong
    try {
        await adminDb.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
        await adminDb.execute(`DROP USER IF EXISTS \`${dbUser}\`@'%'`);
    } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
    }
    throw error;
  } finally {
    if (adminDb) adminDb.end();
  }
};

// Delete a MySQL database and user
MysqlDatabase.delete = async (recordId, userId) => {
  // Step 1: Get the db_name and db_user from tracking table
  const [rows] = await db.execute('SELECT * FROM mysql_databases WHERE id = ? AND user_id = ?', [recordId, userId]);
  if (rows.length === 0) {
    const err = new Error('Database record not found or you do not have permission.');
    err.statusCode = 404;
    throw err;
  }
  const { db_name, db_user } = rows[0];

  // Step 2: Drop the actual database and user
  const adminDb = createAdminConnection();
  try {
    await adminDb.execute(`DROP DATABASE IF EXISTS \`${db_name}\``);
    await adminDb.execute(`DROP USER IF EXISTS \`${db_user}\`@'%'`);
    console.log(`Successfully dropped DB ${db_name} and USER ${db_user}`);

    // Step 3: Delete from tracking table
    const [result] = await db.execute('DELETE FROM mysql_databases WHERE id = ?', [recordId]);
    return result.affectedRows;

  } catch (error) {
    console.error('Error deleting MySQL database:', error);
    throw error;
  } finally {
    if (adminDb) adminDb.end();
  }
};

module.exports = MysqlDatabase;
