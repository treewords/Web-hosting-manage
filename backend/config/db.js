const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Test the connection
promisePool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Connection successful.');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection failed:', err.message);
    // Exit process with failure
    process.exit(1);
  });

module.exports = promisePool;
