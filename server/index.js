const express = require('express');
const { createUsersTable } = require('./models/userModel');
const userRoutes = require('./routes/userRoutes');

// Initialize Express app
const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Database
createUsersTable();

// API Routes
app.use('/api/users', userRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
