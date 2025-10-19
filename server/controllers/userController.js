const { findUserByEmailOrStudentId, createUser } = require('../models/userModel');

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

module.exports = {
  signup,
};
