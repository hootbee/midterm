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

    // Check if the admin column exists
    const [adminColumn] = await conn.query(
      `SELECT * 
       FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = '202121134' 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'admin';`
    );

    if (!adminColumn) {
      console.log("'users' table is missing the 'admin' column, adding it...");
      await conn.query("ALTER TABLE users ADD COLUMN admin BOOLEAN NOT NULL DEFAULT FALSE;");
      console.log("'admin' column added successfully.");
    } else {
      console.log("'admin' column already exists in 'users' table.");
    }

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
  const { name, email, student_id, password, admin = false } = userData; // Default admin to false

  try {
    conn = await pool.getConnection();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate UUID
    const newUserUUID = uuidv4();

    const query = 'INSERT INTO users (name, email, student_id, password, uuid, admin) VALUES (?, ?, ?, ?, ?, ?)';
    const result = await conn.query(query, [name, email, student_id, hashedPassword, newUserUUID, admin]);
    
    return { email, name, uuid: newUserUUID, admin }; // Return some info about the created user
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

const findUserByUuid = async (uuid) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'SELECT email, uuid, name, student_id, reputation_score, created_at FROM users WHERE uuid = ?';
    const rows = await conn.query(query, [uuid]);
    return rows[0]; // Return the first user found, or undefined
  } finally {
    if (conn) conn.release();
  }
};

const deleteUserByUuid = async (uuid) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'DELETE FROM users WHERE uuid = ?';
    const result = await conn.query(query, [uuid]);
    return result;
  } finally {
    if (conn) conn.release();
  }
};

const updateUserByUuid = async (uuid, updateData) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { name, email, student_id } = updateData;
    const query = 'UPDATE users SET name = ?, email = ?, student_id = ? WHERE uuid = ?';
    const result = await conn.query(query, [name, email, student_id, uuid]);
    return result;
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
  findUserByUuid,
  deleteUserByUuid,
  updateUserByUuid,
};
