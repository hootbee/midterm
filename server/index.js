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
const reportRoutes = require('./routes/reportRoutes');
const commentRoutes = require('./routes/commentRoutes');
const dmRoutes = require('./routes/dmRoutes');

// --- Swagger Setup ---
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Auction API',
      version: '1.0.0',
      description: 'API documentation for the Auction application',
      contact: {
        name: 'Developer',
        email: 'developer@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs (route files)
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
// --- End Swagger Setup ---


// Initialize
const app = express();

const port = 3001; // From user's snippet
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
app.use(express.urlencoded({ extended: true })); // Added this for consistency
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/private_uploads', express.static(path.join(__dirname, 'private_uploads'))); // Added this for consistency

// --- Swagger UI Route ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// --- End Swagger UI Route ---

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', commentRoutes);
app.use('/api/dm', dmRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});


// Function to create a default admin user
const createAdminUserIfNeeded = async () => {
  try {
    // Using 'admin@test.com' to be consistent with the previous error message
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const adminUser = await findUserByEmail(adminEmail);
    if (!adminUser) {
      console.log('Admin user not found, creating one...');
      await createUser({
        name: 'Admin',
        email: adminEmail,
        student_id: '00000000', // Placeholder student ID
        password: adminPassword,
        admin: true,
      });
      console.log('Admin user created successfully.');
    } else {
        console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    // We should probably exit here if we can't create the admin user
    // but for now, we'll just log the error.
  }
};

// Initialize Databases and create admin
const startServer = async () => {
  try {
      await initializeMariaDB(); // For MariaDB
      console.log("✅ MariaDB initialized successfully.");
      await createAdminUserIfNeeded();
      await connectMongo(); // For MongoDB
      console.log("✅ MongoDB connected successfully.");

      httpServer.listen(port, () => {
        console.log(`✅ Backend server with Socket.IO listening at http://localhost:${port}`);
        console.log(`📖 Swagger UI available at http://localhost:${port}/api-docs`);
      });
  } catch (error) {
      console.error('❌ Failed to start the server:', error);
      process.exit(1);
  }
};

startServer();
