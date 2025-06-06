import dotenv from 'dotenv';

dotenv.config();

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test_db';
process.env.MAIL_API_KEY = 'test-mailjet-api-key';
process.env.MAIL_API_SECRET = 'test-mailjet-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Disable database connections in tests
process.env.DISABLE_DB_FOR_TESTS = 'true'; 