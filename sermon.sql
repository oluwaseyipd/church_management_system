-- Create Sermon Table
CREATE TABLE sermons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  minister VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  bibleText VARCHAR(255),
  category VARCHAR(255) DEFAULT 'General',
  coverPhoto VARCHAR(1024) NOT NULL,
  audioSource VARCHAR(1024) NULL,
  featureStatus TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Sermon Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a new user
INSERT INTO users (name, email, password) 
VALUES (
  'name', 
  'email', 
  'Bcrypt hash password'
);

