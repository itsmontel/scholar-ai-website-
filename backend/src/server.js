require('dotenv').config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const documentRoutes = require('./routes/documents');
const analysisRoutes = require('./routes/analysis');
const subscriptionRoutes = require('./routes/subscriptions');
const webhookRoutes = require('./routes/webhooks');

const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./database/connection');
const securityMiddleware = require('./middleware/security');
const { generalLimiter, authLimiter, analysisLimiter, uploadLimiter } = require('./middleware/rateLimiting');

// Initialize storage service if using Supabase Storage
let storageService = null;
if (process.env.USE_SUPABASE_STORAGE === 'true') {
  storageService = require('./services/supabaseStorage');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(securityMiddleware);
app.use(compression());

// General rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [process.env.FRONTEND_URL || 'https://writescholar.com'])
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Webhook route MUST come BEFORE body parsing middleware
// This is because Stripe signature verification needs raw body
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WriteScholar Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      documents: '/api/documents',
      analysis: '/api/analysis',
      subscriptions: '/api/subscriptions',
      webhooks: '/api/webhooks'
    },
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'WriteScholar Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Serve uploaded files in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', uploadLimiter, documentRoutes);
app.use('/api/analysis', analysisLimiter, analysisRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
// Webhooks already registered before body parser (line 45)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize Supabase Storage if enabled
    if (storageService && typeof storageService.initializeBucket === 'function') {
      console.log('🔗 Initializing Supabase Storage...');
      const storageInitialized = await storageService.initializeBucket();
      if (storageInitialized) {
        console.log('✅ Supabase Storage initialized successfully');
      } else {
        console.log('⚠️  Supabase Storage initialization failed, but continuing...');
      }
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 WriteScholar Backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      if (process.env.USE_SUPABASE_STORAGE === 'true') {
        console.log('📦 Storage: Supabase Storage');
      } else if (process.env.NODE_ENV === 'production') {
        console.log('📦 Storage: AWS S3');
      } else {
        console.log('📦 Storage: Local filesystem (development)');
      }
      
      // Run citation cleanup immediately on startup
      const subscriptionService = require('./services/subscriptionService');
      subscriptionService.cleanupOldCitations()
        .then(() => console.log('✅ Initial citation cleanup completed'))
        .catch(error => console.error('❌ Initial citation cleanup failed:', error));
      
      // Schedule citation cleanup to run daily (every 24 hours)
      setInterval(async () => {
        console.log('🧹 Running scheduled citation cleanup...');
        await subscriptionService.cleanupOldCitations();
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
