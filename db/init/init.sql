-- Create the 'users' table if it doesn't exist
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('client', 'reseller', 'admin') NOT NULL DEFAULT 'client',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- You can add a default admin user for testing if you want
-- INSERT INTO `users` (email, password, role) VALUES ('admin@example.com', '[HASHED_PASSWORD]', 'admin');
-- Note: You would need to pre-hash the password. For now, we'll register users via the API.
