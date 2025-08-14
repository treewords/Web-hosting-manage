-- Create the 'users' table if it doesn't exist
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('client', 'reseller', 'admin') NOT NULL DEFAULT 'client',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reset_token` VARCHAR(255) NULL,
  `reset_token_expires` DATETIME NULL,
  `two_factor_secret` VARCHAR(255) NULL,
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- You can add a default admin user for testing if you want
-- INSERT INTO `users` (email, password, role) VALUES ('admin@example.com', '[HASHED_PASSWORD]', 'admin');
-- Note: You would need to pre-hash the password. For now, we'll register users via the API.

-- Create the 'domains' table
CREATE TABLE IF NOT EXISTS `domains` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `domain_name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_domain_per_user` (`user_id`, `domain_name`)
) ENGINE=InnoDB;

-- Create the 'mysql_databases' table for tracking
CREATE TABLE IF NOT EXISTS `mysql_databases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `db_name` VARCHAR(255) NOT NULL UNIQUE,
  `db_user` VARCHAR(255) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tables for simulated Postfix/Dovecot mail server
CREATE TABLE IF NOT EXISTS `mail_domains` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `domain` VARCHAR(255) NOT NULL UNIQUE,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `user_id` INT NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mail_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL, -- Will store hashed password
  `domain_id` INT NOT NULL,
  FOREIGN KEY (`domain_id`) REFERENCES `mail_domains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mail_aliases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `source` VARCHAR(255) NOT NULL,
  `destination` VARCHAR(255) NOT NULL,
  `domain_id` INT NOT NULL,
  FOREIGN KEY (`domain_id`) REFERENCES `mail_domains`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `source_destination_unique` (`source`, `destination`)
) ENGINE=InnoDB;
