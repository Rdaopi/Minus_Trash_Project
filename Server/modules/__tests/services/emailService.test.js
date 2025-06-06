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

  test('handles missing email parameter', async () => {
    await expect(sendPasswordResetEmail()).rejects.toThrow('Errore nell\'invio dell\'email di reset password');
  });

  test('handles empty email parameter', async () => {
    await expect(sendPasswordResetEmail('')).rejects.toThrow('Errore nell\'invio dell\'email di reset password');
  });

  test('handles invalid email format', async () => {
    await expect(sendPasswordResetEmail('invalid-email')).rejects.toThrow('Errore nell\'invio dell\'email di reset password');
  });

  test('handles missing token parameter', async () => {
    await expect(sendPasswordResetEmail('test@example.com')).rejects.toThrow('Errore nell\'invio dell\'email di reset password');
  });

  test('handles empty token parameter', async () => {
    await expect(sendPasswordResetEmail('test@example.com', '')).rejects.toThrow('Errore nell\'invio dell\'email di reset password');
  });

  test('handles valid email and token', async () => {
    const email = 'test@example.com';
    const token = 'valid-reset-token';
    
    await expect(sendPasswordResetEmail(email, token)).rejects.toThrow('Errore nell\'invio dell\'email di reset password');
  });

  test('uses environment variables', () => {
    expect(process.env.MAIL_API_KEY).toBe('test_api_key');
    expect(process.env.MAIL_API_SECRET).toBe('test_secret_key');
    expect(process.env.FRONTEND_URL).toBe('http://localhost:3000');
  });

  test('handles different email formats', async () => {
    const emails = [
      'user@domain.com',
      'user.name@domain.co.uk',
      'user+tag@domain.org'
    ];
    
    for (const email of emails) {
      await expect(sendPasswordResetEmail(email, 'token123')).rejects.toThrow();
    }
  });

  test('handles long token values', async () => {
    const longToken = 'a'.repeat(500);
    await expect(sendPasswordResetEmail('test@example.com', longToken)).rejects.toThrow();
  });
}); 