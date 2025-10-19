require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectMongo = require('./config/mongo');
const { createUsersTable } = require('./models/userModel');
const initializeSocket = require('./socket');
const userRoutes = require('./routes/userRoutes');
const auctionRoutes = require('./routes/auctionRoutes');

// Initialize
const app = express();
const port = 3001;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Allow requests from the React client
    methods: ["GET", "POST"]
  }
});

// Initialize Socket.IO logic
initializeSocket(io);

// Middleware
app.use(express.json());
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
httpServer.listen(port, () => {
  console.log(`Backend server with Socket.IO listening at http://localhost:${port}`);
});