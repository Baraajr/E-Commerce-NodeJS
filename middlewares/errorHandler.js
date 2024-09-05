const AppError = require('../utils/appError');

// Invalid mongo ID
const handleCastIdError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}. Please use a valid ${error.path}.`;
  return new AppError(message, 400);
};

// Duplicate Fields
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

// Validation Error
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// JWT Errors
// like JWT mailFormed
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// JWT expiration error
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Sending Development Errors
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    message: err.message,
    status: err.status,
    error: err,
    stack: err.stack,
  });
  // console.log(err);
};

// Sending Production Errors
const sendErrorProd = (err, res) => {
  // send the error if (operational) means that i created that error so it's safe to send
  if (err.isOperational) {
    res.status(err.statusCode).json({
      message: err.message,
      status: err.status,
    });
  } else {
    //means the error is coming from other place (might contain sensitive data)
    // 1) Log error only in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      console.error('ERROR 💥', err);
    }

    // 2) Send generic message
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // copying the error
  let error = Object.assign(err);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (error.name === 'CastError') error = handleCastIdError(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
