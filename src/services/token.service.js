const jwt = require('jsonwebtoken');
const config = require('../config');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
