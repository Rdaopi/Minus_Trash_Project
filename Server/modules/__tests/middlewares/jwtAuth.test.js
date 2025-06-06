import { jest } from '@jest/globals';
import { jwtAuth } from '../../auth/middlewares/jwtAuth.js';

describe('JWT Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('middleware function exists', () => {
    expect(typeof jwtAuth).toBe('function');
  });

  test('rejects missing token', async () => {
    await jwtAuth(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Token mancante'
      })
    );
  });
}); 