const jwt = require('jsonwebtoken');

const socketAuthMiddleware = (socket, next) => {
  // The token is sent in the 'auth' object of the socket handshake.
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    // Verify the token with the hardcoded secret
    const decoded = jwt.verify(token, 'a1b2c3d4e5f6!@#$%^');
    socket.user = decoded; // Attach user payload to the socket object
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuthMiddleware;
