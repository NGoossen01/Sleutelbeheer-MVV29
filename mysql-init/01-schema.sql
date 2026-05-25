-- Sleutelbeheer MVV29 Database Schema
CREATE DATABASE IF NOT EXISTS sleutelbeheer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sleutelbeheer;

CREATE TABLE IF NOT EXISTS persons (
  id VARCHAR(50) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS key_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rooms JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `keys` (
  id VARCHAR(50) PRIMARY KEY,
  number VARCHAR(50) NOT NULL UNIQUE,
  key_type_id VARCHAR(50) NOT NULL,
  room_ids JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_type_id) REFERENCES key_types(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(50) PRIMARY KEY,
  key_id VARCHAR(50) NOT NULL,
  person_id VARCHAR(50) NOT NULL,
  type ENUM('ISSUED','RETURNED','LOST','BROKEN','EXTENDED') NOT NULL,
  timestamp BIGINT NOT NULL,
  signature LONGTEXT,
  expiration_date BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_id) REFERENCES `keys`(id),
  FOREIGN KEY (person_id) REFERENCES persons(id)
);

CREATE INDEX idx_transactions_key ON transactions(key_id);
CREATE INDEX idx_transactions_person ON transactions(person_id);
