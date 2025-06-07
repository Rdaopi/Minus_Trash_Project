import express from 'express';
import cors from 'cors';
import passport from 'passport';
import authRoutes from '../../auth/routes.js';

// Mock database connection for tests
jest.mock('../../../config/db.js', () => ({
  default: jest.fn().mockResolvedValue(true)
}));

// Mock logger to avoid console spam in tests
jest.mock('../../../core/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  logRequest: jest.fn((req, res, next) => next())
}));

// Create test app
export const createTestApp = () => {
  const app = express();

  // CORS configuration for tests
  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
  };

  // Middleware
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(passport.initialize());

  // Routes
  app.use('/api/auth', authRoutes);

  // Simple status route
  app.get('/', (req, res) => {
    res.json({ status: 'Test API running' });
  });

  // Error handling
  app.use((err, req, res, next) => {
    if (!err) return;
    res.status(err.statusCode || 500).json({ 
      error: err.message || 'Internal server error' 
    });
  });

  return app;
};

export default createTestApp; 