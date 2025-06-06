import { jest } from '@jest/globals';
import { 
    getAllUsers, 
    deleteUserById, 
    updateUserById, 
    refreshTokenHandler, 
    login, 
    register,
    profile_update,
    changePassword,
    user_delete,
    logout
} from '../../auth/controllers/userController.js';

// Mock dependencies
jest.mock('../../auth/models/User.js');
jest.mock('../../auth/models/Token.js');
jest.mock('../../auth/services/AuthService.js');
jest.mock('bcryptjs');
jest.mock('../../../core/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('UserController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: { 
        email: 'test@example.com', 
        password: 'Password123!',
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        fullName: { name: 'Test', surname: 'User' },
        username: 'testuser'
      },
      user: { 
        _id: 'user123',
        role: 'amministratore',
        email: 'test@example.com'
      },
      params: { userId: 'user456' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Function Existence Tests', () => {
    test('register function exists and is async', () => {
      expect(typeof register).toBe('function');
      expect(register.constructor.name).toBe('AsyncFunction');
    });

    test('login function exists and is async', () => {
      expect(typeof login).toBe('function');
      expect(login.constructor.name).toBe('AsyncFunction');
    });

    test('getAllUsers function exists and is async', () => {
      expect(typeof getAllUsers).toBe('function');
      expect(getAllUsers.constructor.name).toBe('AsyncFunction');
    });

    test('deleteUserById function exists and is async', () => {
      expect(typeof deleteUserById).toBe('function');
      expect(deleteUserById.constructor.name).toBe('AsyncFunction');
    });

    test('updateUserById function exists and is async', () => {
      expect(typeof updateUserById).toBe('function');
      expect(updateUserById.constructor.name).toBe('AsyncFunction');
    });

    test('refreshTokenHandler function exists and is async', () => {
      expect(typeof refreshTokenHandler).toBe('function');
      expect(refreshTokenHandler.constructor.name).toBe('AsyncFunction');
    });

    test('changePassword function exists and is async', () => {
      expect(typeof changePassword).toBe('function');
      expect(changePassword.constructor.name).toBe('AsyncFunction');
    });

    test('user_delete function exists and is async', () => {
      expect(typeof user_delete).toBe('function');
      expect(user_delete.constructor.name).toBe('AsyncFunction');
    });

    test('logout function exists and is async', () => {
      expect(typeof logout).toBe('function');
      expect(logout.constructor.name).toBe('AsyncFunction');
    });

    test('profile_update function exists and is async', () => {
      expect(typeof profile_update).toBe('function');
      expect(profile_update.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Basic Function Calls', () => {
    test('changePassword handles missing input validation', async () => {
      req.body = {}; // Empty body
      
      await changePassword(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password attuale e nuova password sono obbligatorie'
      });
    });

    test('profile_update handles missing fullName validation', async () => {
      req.body = { fullName: { name: 'Test' } }; // Missing surname
      
      await profile_update(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Nome e cognome sono obbligatori'
      });
    });

    test('user_delete handles missing user authentication', async () => {
      req.user = null; // No authenticated user
      
      await user_delete(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Utente non autenticato'
      });
    });

    test('logout handles missing refresh token', async () => {
      req.body = {}; // No refresh token
      
      await logout(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Refresh token mancante o specificare logoutAll'
      });
    });

    test('user_delete handles successful deletion', async () => {
      // Mock User.findById and findByIdAndDelete
      const User = (await import('../../auth/models/User.js')).default;
      const Token = (await import('../../auth/models/Token.js')).default;
      
      User.findById = jest.fn().mockResolvedValue({ _id: 'user123' });
      User.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'user123' });
      Token.revokeAllUserTokens = jest.fn().mockResolvedValue({ modifiedCount: 2 });
      
      await user_delete(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        message: 'Utente eliminato con successo'
      });
      
      // Verifichiamo che i mock siano stati chiamati
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Token.revokeAllUserTokens).toHaveBeenCalledWith('user123');
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
    });
  });
}); 