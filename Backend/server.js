const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const exportRoutes = require('./routes/export');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// Trust proxy for Vercel or any proxy
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL  // set FRONTEND_URL in Vercel
    : ['http://localhost:3000', 'http://localhost:5173'], // dev
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/export', exportRoutes);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  let error = { ...err, message: err.message };

  if (err.name === 'CastError') error = { message: 'Resource not found', statusCode: 404 };
  if (err.code === 11000) error = { message: 'Duplicate field value entered', statusCode: 400 };
  if (err.name === 'ValidationError') {
    error = { message: Object.values(err.errors).map(val => val.message).join(', '), statusCode: 400 };
  }
  if (err.name === 'JsonWebTokenError') error = { message: 'Invalid token', statusCode: 401 };
  if (err.name === 'TokenExpiredError') error = { message: 'Token expired', statusCode: 401 };

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
