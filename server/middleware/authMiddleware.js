const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('\n--- Auth Middleware Triggered ---');
  const authHeader = req.header('Authorization');
  console.log('Received Authorization Header:', authHeader);

  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    console.log('Auth Error: No token found.');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  console.log('Extracted Token:', token);

  try {
    const decoded = jwt.verify(token, 'a1b2c3d4e5f6!@#$%^');
    console.log('Auth Success: Token successfully verified.');
    console.log('Decoded Payload:', decoded);
    req.user = decoded; // Add user from payload to request
    next();
  } catch (e) {
    console.error('Auth Error: Token verification failed.', e.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
