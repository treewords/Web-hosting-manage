const db = require('../config/db');

const Email = {};

// === Domain Methods ===
Email.listDomains = async (userId) => {
    const sql = 'SELECT * FROM mail_domains WHERE user_id = ?';
    const [rows] = await db.execute(sql, [userId]);
    return rows;
};

Email.addDomain = async (userId, domain) => {
    const sql = 'INSERT INTO mail_domains (user_id, domain) VALUES (?, ?)';
    const [result] = await db.execute(sql, [userId, domain]);
    return { id: result.insertId, user_id: userId, domain };
};

// === Mailbox (User) Methods ===
Email.listAccountsByDomain = async (domainId) => {
    const sql = 'SELECT id, email FROM mail_users WHERE domain_id = ?';
    const [rows] = await db.execute(sql, [domainId]);
    return rows;
};

Email.addAccount = async (domainId, email, hashedPassword) => {
    const sql = 'INSERT INTO mail_users (domain_id, email, password) VALUES (?, ?, ?)';
    const [result] = await db.execute(sql, [domainId, email, hashedPassword]);
    return { id: result.insertId, email };
};

Email.deleteAccount = async (accountId, domainId) => {
    // We check domainId to ensure user can only delete accounts from their domains
    const sql = 'DELETE FROM mail_users WHERE id = ? AND domain_id = ?';
    const [result] = await db.execute(sql, [accountId, domainId]);
    return result.affectedRows;
};


// === Alias (Forwarder) Methods ===
Email.listAliasesByDomain = async (domainId) => {
    const sql = 'SELECT id, source, destination FROM mail_aliases WHERE domain_id = ?';
    const [rows] = await db.execute(sql, [domainId]);
    return rows;
};

Email.addAlias = async (domainId, source, destination) => {
    const sql = 'INSERT INTO mail_aliases (domain_id, source, destination) VALUES (?, ?, ?)';
    const [result] = await db.execute(sql, [domainId, source, destination]);
    return { id: result.insertId, source, destination };
};

Email.deleteAlias = async (aliasId, domainId) => {
    const sql = 'DELETE FROM mail_aliases WHERE id = ? AND domain_id = ?';
    const [result] = await db.execute(sql, [aliasId, domainId]);
    return result.affectedRows;
};

module.exports = Email;
