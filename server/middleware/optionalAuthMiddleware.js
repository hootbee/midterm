const jwt = require('jsonwebtoken');

const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, 'a1b2c3d4e5f6!@#$%^');
        req.user = decoded;
        next();
    } catch (e) {
        req.user = null;
        next();
    }
};

module.exports = optionalAuthMiddleware;
