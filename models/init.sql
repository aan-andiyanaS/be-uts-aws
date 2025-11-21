CREATE DATABASE sampahdb;

USE sampahdb;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(200),
  password VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user'
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  caption TEXT,
  price INT,
  image_url TEXT
);
