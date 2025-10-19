require('dotenv').config();
const express = require('express');
const connectMongo = require('./config/mongo');
const { createUsersTable } = require('./models/userModel');
const userRoutes = require('./routes/userRoutes');
const auctionRoutes = require('./routes/auctionRoutes');

// Initialize Express app
const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Initialize Databases
createUsersTable(); // For MariaDB
connectMongo(); // For MongoDB

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auctions', auctionRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
