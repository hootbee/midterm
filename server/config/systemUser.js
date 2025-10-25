const { findUserByEmail, createUser } = require('../models/userModel');
const bcrypt = require('bcrypt');

const SYSTEM_UUID = 'SYSTEM';

const createSystemUserIfNeeded = async () => {
  try {
    const existingUser = await findUserByEmail('system@system.com');
    if (existingUser) {
      console.log('System user already exists.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('a_very_secure_password_!@#$', salt);

    await createUser({
      uuid: SYSTEM_UUID,
      name: 'SYSTEM',
      email: 'system@system.com',
      student_id: '00000000',
      password: hashedPassword,
      admin: true,
    });

    console.log('System user created successfully!');
  } catch (error) {
    console.error('Error creating system user:', error);
  }
};

module.exports = { createSystemUserIfNeeded };
