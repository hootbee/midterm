const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Function to initialize all MariaDB tables
const initializeMariaDB = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        uuid VARCHAR(36) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        student_id VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        reputation_score INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS bid_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        auction_item_id VARCHAR(255) NOT NULL,
        seller_uuid VARCHAR(36) NOT NULL,
        bidder_uuid VARCHAR(36) NOT NULL,
        bid_amount DECIMAL(10, 2) NOT NULL,
        bid_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("MariaDB tables are ready.");
  } catch (err) {
    console.error("Error ensuring 'users' table exists:", err);
  } finally {
    if (conn) conn.release();
  }
};

// Function to find a user by email or student ID
const findUserByEmailOrStudentId = async (email, studentId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'SELECT * FROM users WHERE email = ? OR student_id = ?';
    const rows = await conn.query(query, [email, studentId]);
    return rows[0]; // Return the first user found, or undefined
  } finally {
    if (conn) conn.release();
  }
};

// Function to create a new user
const createUser = async (userData) => {
  let conn;
  const { name, email, student_id, password } = userData;

  try {
    conn = await pool.getConnection();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate UUID
    const newUserUUID = uuidv4();

    const query = 'INSERT INTO users (name, email, student_id, password, uuid) VALUES (?, ?, ?, ?, ?)';
    const result = await conn.query(query, [name, email, student_id, hashedPassword, newUserUUID]);
    
    return { email, name, uuid: newUserUUID }; // Return some info about the created user
  } finally {
    if (conn) conn.release();
  }
};

const findUserByEmail = async (email) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'SELECT * FROM users WHERE email = ?';
    const rows = await conn.query(query, [email]);
    return rows[0]; // Return the first user found, or undefined
  } finally {
    if (conn) conn.release();
  }
};

// Function to log a bid to MariaDB
const logBid = async (bidData) => {
  let conn;
  const { auction_item_id, seller_uuid, bidder_uuid, bid_amount } = bidData;
  try {
    conn = await pool.getConnection();
    const query = 'INSERT INTO bid_logs (auction_item_id, seller_uuid, bidder_uuid, bid_amount) VALUES (?, ?, ?, ?)';
    await conn.query(query, [auction_item_id, seller_uuid, bidder_uuid, bid_amount]);
    console.log('Bid successfully logged to MariaDB.');
  } catch (err) {
    console.error('Error logging bid to MariaDB:', err);
    // We don't re-throw the error here, as logging failure should not stop the main operation.
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  initializeMariaDB,
  findUserByEmailOrStudentId,
  createUser,
  findUserByEmail,
  logBid,
};
