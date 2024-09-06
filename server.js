/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');

// Reading the .env file
require('dotenv').config({ path: './config.env' });

const connectDb = require('./config/db');
const globalErrorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');

//routes
const mountRoutes = require('./routes/index');
const { webhookCheckout } = require('./controllers/orderControllers');

// this will read the index file in this folder first

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception: Shutting down...');
  console.log(err.stack || err.message);
});

// Initialize the application
const app = express();

//trust proxies
app.enable('trust proxy');

//webhook checkout happens after user pay successfully
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout,
);

//middlewares

// For parsing request bodies
app.use(express.json());

// static files
app.use(express.static(path.join(__dirname, 'uploads')));

// for using form data
app.use(express.urlencoded({ extended: true }));

// For parsing cookies
app.use(cookieParser());

app.use(cors()); // This will enable CORS for all routes
app.options('*', cors());
app.use(compression());

// If you want to restrict to specific origins, you can configure it like this:
// app.use(
//   cors({
//     origin: 'http://localhost:3000', // Allow requests only from this origin
//   }),
// );

// Logging requests for development
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Connect to the database
connectDb();

// Define routes
mountRoutes(app);

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Start the server
const port = process.env.PORT || 8000;
const server = app.listen(port, () =>
  console.log(`Server running on port: ${port}`),
);

// Handle unhandled promise rejections
// like database connection rejection
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection: Shutting down...');
  console.log(err.stack || err.message);
  server.close(() => process.exit(1));
});
