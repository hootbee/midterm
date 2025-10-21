const { findUserByEmailOrStudentId, createUser, findUserByEmail, findUserByUuid } = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/users/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, studentId, password } = req.body;

    // 1. Validate input
    if (!name || !email || !studentId || !password) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    // 2. Check for duplicate user
    const existingUser = await findUserByEmailOrStudentId(email, studentId);
    if (existingUser) {
      let message = 'User already exists.';
      if (existingUser.email === email) {
        message = 'An account with this email already exists.';
      } else if (existingUser.student_id === studentId) {
        message = 'An account with this student ID already exists.';
      }
      return res.status(400).json({ message });
    }

    // 3. Create new user
    const newUser = await createUser({
      name,
      email,
      student_id: studentId,
      password,
    });

    // 4. Respond with success
    res.status(201).json({
      message: 'User registered successfully!',
      user: newUser,
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during user registration.' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const login = async (req, res) => {
  console.log('Login attempt with body:', req.body);
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      console.log('Login Error: Missing email or password.');
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // 2. Find user by email
    const user = await findUserByEmail(email);
    console.log('User found in database:', user);
    if (!user) {
      console.log('Login Error: User not found.');
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      console.log('Login Error: Password does not match.');
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 4. Create and sign JWT
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      admin: user.admin, // Include admin status in the token
    };

    const token = jwt.sign(payload, 'a1b2c3d4e5f6!@#$%^', {
      expiresIn: '1h', // Token expires in 1 hour
    });

    // 5. Respond with token
    console.log('Login successful, sending token.');
    res.json({
      message: 'Logged in successfully!',
      token: token,
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// @desc    Search for a user by UUID
// @route   GET /api/users/search/:uuid
// @access  Admin
const searchUserByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const user = await findUserByUuid(uuid);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error searching for user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // The user's UUID is available from the auth middleware
    const user = await findUserByUuid(req.user.uuid);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  searchUserByUuid,
  getMe,
};
