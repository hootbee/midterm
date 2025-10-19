const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD||'asdf123',
  database: process.env.DB_DATABASE||'202121134',
  connectionLimit: 5,
  allowPublicKeyRetrieval: true
});

module.exports = pool;
