require('dotenv').config();

console.log("--- Checking Environment Variables ---");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("------------------------------------");

const express = require('express');
const app = express();
const port = 3001; // 프론트엔드와 다른 포트 사용
const mariadb = require('mariadb');

// MariaDB connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'asdf123',
  database: process.env.DB_DATABASE || '202121134',
  connectionLimit: 5,
  allowPublicKeyRetrieval: true
});

// Test DB connection
async function testDbConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("MariaDB connection successful");
    const rows = await conn.query("SELECT 1 as val");
    console.log(rows);
  } catch (err) {
    console.error("MariaDB connection error:", err);
  } finally {
    if (conn) conn.end();
  }
}

testDbConnection();

app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});