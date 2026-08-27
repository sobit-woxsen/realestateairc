const config = require('../config');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  
  // Hide internal error details in production unless it's a specific HTTP error
  const message = (config.nodeEnv === 'production' && statusCode === 500)
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = { errorHandler };
