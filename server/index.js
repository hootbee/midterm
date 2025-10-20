require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectMongo = require('./config/mongo');
const { initializeMariaDB, findUserByEmail, createUser } = require('./models/userModel');
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Function to create a default admin user
const createAdminUserIfNeeded = async () => {
  try {
    const adminUser = await findUserByEmail('admin');
    if (!adminUser) {
      console.log('Admin user not found, creating one...');
      await createUser({
        name: 'Admin',
        email: 'admin',
        student_id: '00000000', // Placeholder student ID
        password: 'admin123',
        admin: true,
      });
      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Initialize Databases and create admin
const startServer = async () => {
  // Initialize Databases and create admin
  await initializeMariaDB(); // For MariaDB
  await createAdminUserIfNeeded();
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
};

startServer();