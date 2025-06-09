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

  test('rejects invalid token format', async () => {
    req.headers.authorization = 'Invalid Token Format';
    
    await jwtAuth(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Token mancante',
        code: 'TOKEN_MISSING'
      })
    );
  });

  test('rejects malformed Bearer token', async () => {
    req.headers.authorization = 'Bearer';
    
    await jwtAuth(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Token mancante',
        code: 'TOKEN_MISSING'
      })
    );
  });

  test('rejects invalid JWT token', async () => {
    req.headers.authorization = 'Bearer invalid-jwt-token';
    
    await jwtAuth(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Token non valido',
        code: 'TOKEN_INVALID'
      })
    );
  });

  test('handles different authorization header formats', async () => {
    // Test with empty header
    req.headers.authorization = '';
    await jwtAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    
    jest.clearAllMocks();
    
    // Test with extra spaces
    req.headers.authorization = '  Bearer  token  ';
    await jwtAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('middleware handles exceptions gracefully', async () => {
    // Test that the middleware does not crash with extreme input
    req.headers.authorization = 'Bearer ' + 'x'.repeat(1000);
    
    await expect(jwtAuth(req, res, next)).resolves.not.toThrow();
    expect(res.status).toHaveBeenCalledWith(401);
  });
}); 