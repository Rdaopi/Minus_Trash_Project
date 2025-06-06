import { jest } from '@jest/globals';

// Mock mongoose to prevent any real database connections
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    pre: jest.fn(),
    post: jest.fn(),
    methods: {},
    statics: {}
  })),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || 'mocked-object-id')
  },
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    readyState: 1
  }
}));

// Mock all external dependencies before any imports
jest.mock('../../../config/db.js', () => ({
  default: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../core/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Create comprehensive mocks for all models and services
const mockUser = function(data) {
  // Constructor behavior
  Object.assign(this, {
    _id: 'mocked-object-id',
    username: data?.username || 'testuser',
    email: data?.email || 'test@example.com',
    fullName: data?.fullName || { name: 'Test', surname: 'User' },
    save: jest.fn().mockResolvedValue({
      _id: 'mocked-object-id',
      username: data?.username || 'testuser',
      email: data?.email || 'test@example.com',
      fullName: data?.fullName || { name: 'Test', surname: 'User' }
    })
  });
};

// Add static methods to the constructor
mockUser.find = jest.fn();
mockUser.findOne = jest.fn();
mockUser.findById = jest.fn();
mockUser.findByIdAndUpdate = jest.fn();
mockUser.findByIdAndDelete = jest.fn();
mockUser.create = jest.fn();
mockUser.deleteMany = jest.fn();
mockUser.updateMany = jest.fn();
mockUser.countDocuments = jest.fn();
mockUser.aggregate = jest.fn();

const mockToken = {
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
  revokeAllUserTokens: jest.fn(),
  hashToken: jest.fn(),
  generateToken: jest.fn()
};

const mockAuthService = {
  generateTokens: jest.fn(),
  verifyToken: jest.fn(),
  refreshToken: jest.fn()
};

const mockBcrypt = {
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
};

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn()
};

// Mock the modules
jest.mock('../../auth/models/User.js', () => ({
  default: mockUser
}));

jest.mock('../../auth/models/Token.js', () => ({
  default: mockToken
}));

jest.mock('../../auth/services/AuthService.js', () => ({
  default: mockAuthService
}));

jest.mock('bcryptjs', () => ({
  default: mockBcrypt
}));

jest.mock('jsonwebtoken', () => ({
  default: mockJwt
}));

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
        _id: 'mocked-object-id',
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
    
    jest.clearAllMocks();
  });

  describe('Function Existence Tests', () => {
    test('all functions exist and are async', () => {
      const functions = [
        register, login, getAllUsers, deleteUserById, updateUserById,
        refreshTokenHandler, profile_update, changePassword, user_delete, logout
      ];

      functions.forEach(fn => {
        expect(typeof fn).toBe('function');
        expect(fn.constructor.name).toBe('AsyncFunction');
      });
    });
  });

  describe('getAllUsers', () => {
    test('should return users for admin', async () => {
      const mockUsers = [
        { _id: 'user1', username: 'user1', email: 'user1@example.com' },
        { _id: 'user2', username: 'user2', email: 'user2@example.com' }
      ];

      mockUser.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUsers)
        })
      });

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    test('should return 403 for non-admin user', async () => {
      req.user.role = 'cittadino';

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Accesso non autorizzato' });
    });

    test('should handle database errors', async () => {
      mockUser.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Errore nel recupero degli utenti' });
    });
  });

  describe('deleteUserById', () => {
    test('should delete user successfully', async () => {
      const mockUserData = { _id: 'user456', role: 'cittadino' };
      mockUser.findById.mockResolvedValue(mockUserData);
      mockUser.findByIdAndDelete.mockResolvedValue(mockUserData);

      await deleteUserById(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Utente eliminato con successo' });
    });

    test('should return 403 for non-admin user', async () => {
      req.user.role = 'cittadino';

      await deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Accesso non autorizzato' });
    });

    test('should return 400 when trying to delete own account', async () => {
      req.params.userId = 'mocked-object-id'; // Same as req.user._id

      await deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Non puoi eliminare il tuo account' });
    });

    test('should return 404 when user not found', async () => {
      mockUser.findById.mockResolvedValue(null);

      await deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Utente non trovato' });
    });

    test('should return 403 when trying to delete another admin', async () => {
      const mockUserData = { _id: 'user456', role: 'amministratore' };
      mockUser.findById.mockResolvedValue(mockUserData);

      await deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Non puoi eliminare altri amministratori' });
    });

    test('should handle database errors', async () => {
      mockUser.findById.mockRejectedValue(new Error('Database error'));

      await deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Errore nell\'eliminazione dell\'utente' });
    });
  });

  describe('updateUserById', () => {
    test('should update user successfully', async () => {
      const existingUser = { _id: 'user456', role: 'cittadino' };
      const updatedUser = { 
        _id: 'user456', 
        role: 'operatore_comunale',
        toObject: jest.fn().mockReturnValue({ _id: 'user456', role: 'operatore_comunale' })
      };

      mockUser.findById.mockResolvedValue(existingUser);
      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser)
      });

      req.body = { role: 'operatore_comunale' };

      await updateUserById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        _id: 'user456',
        role: 'operatore_comunale',
        roleChanged: true,
        previousRole: 'cittadino'
      });
    });

    test('should return 403 for non-admin user', async () => {
      req.user.role = 'cittadino';

      await updateUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Accesso non autorizzato' });
    });

    test('should return 400 when trying to update own account', async () => {
      req.params.userId = 'mocked-object-id'; // Same as req.user._id

      await updateUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usa l\'endpoint di aggiornamento profilo per il tuo account' });
    });

    test('should handle isActive deactivation', async () => {
      const existingUser = { _id: 'user456', role: 'cittadino' };
      const updatedUser = { 
        _id: 'user456', 
        isActive: false,
        toObject: jest.fn().mockReturnValue({ _id: 'user456', isActive: false })
      };

      mockUser.findById.mockResolvedValue(existingUser);
      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser)
      });

      req.body = { isActive: false };

      await updateUserById(req, res);

      expect(req.body.blockedAt).toBeInstanceOf(Date);
    });

    test('should handle isActive reactivation', async () => {
      const existingUser = { _id: 'user456', role: 'cittadino' };
      const updatedUser = { 
        _id: 'user456', 
        isActive: true,
        toObject: jest.fn().mockReturnValue({ _id: 'user456', isActive: true })
      };

      mockUser.findById.mockResolvedValue(existingUser);
      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser)
      });

      req.body = { isActive: true };

      await updateUserById(req, res);

      expect(req.body.blockedAt).toBeNull();
    });

    test('should hash password when provided', async () => {
      const existingUser = { _id: 'user456', role: 'cittadino' };
      const updatedUser = { 
        _id: 'user456',
        toObject: jest.fn().mockReturnValue({ _id: 'user456' })
      };

      mockUser.findById.mockResolvedValue(existingUser);
      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser)
      });

      mockBcrypt.genSalt.mockResolvedValue('salt');
      mockBcrypt.hash.mockResolvedValue('hashedPassword');

      req.body = { password: 'newPassword123!' };

      await updateUserById(req, res);

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newPassword123!', 'salt');
      expect(req.body.password).toBe('hashedPassword');
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