const mysql = require('mysql2');
require('dotenv').config();

// This connection uses root privileges to perform admin tasks like CREATE/DROP DATABASE/USER.
// It is NOT a connection pool and should be used sparingly and securely.
const createAdminConnection = () => {
    try {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST || 'db',
            user: 'root', // Always use root for these tasks
            password: process.env.MYSQL_ROOT_PASSWORD,
            port: process.env.DB_PORT || 3306,
        });

        connection.connect((err) => {
            if (err) {
                console.error('❌ MySQL Admin Connection failed:', err.stack);
                throw err;
            }
            console.log('✅ MySQL Admin Connection successful.');
        });

        return connection.promise();
    } catch (error) {
        console.error('Failed to create MySQL admin connection.', error);
        process.exit(1); // Exit if we can't get an admin connection
    }
};

module.exports = createAdminConnection;
