import { jest } from '@jest/globals';
import { sendPasswordResetEmail } from '../../auth/services/emailService.js';

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.MAIL_API_KEY = 'test_api_key';
    process.env.MAIL_API_SECRET = 'test_secret_key';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  test('email function exists', () => {
    expect(typeof sendPasswordResetEmail).toBe('function');
  });
}); 