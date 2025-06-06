import { jest } from '@jest/globals';

// Set test environment variables to prevent database connections
process.env.NODE_ENV = 'test';
process.env.DISABLE_DB_FOR_TESTS = 'true';
process.env.MONGODB_URI = 'mongodb://mock-test-db';

// Mock mongoose ObjectId to return a valid ObjectId-like object
const mockObjectId = jest.fn().mockImplementation((id) => {
  if (id) return id;
  return '507f1f77bcf86cd799439011'; // Valid ObjectId format
});

// Mock mongoose completely before any imports
const mockSchema = jest.fn().mockImplementation(() => ({
  index: jest.fn(),
  pre: jest.fn(),
  post: jest.fn(),
  methods: {},
  statics: {}
}));

// Add Types property to Schema
mockSchema.Types = {
  ObjectId: mockObjectId
};

jest.mock('mongoose', () => ({
  Schema: mockSchema,
  model: jest.fn(),
  Types: {
    ObjectId: mockObjectId
  },
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    readyState: 1,
    close: jest.fn().mockResolvedValue(true)
  }
}));

// Mock database connection
jest.mock('../../../config/db.js', () => ({
  default: jest.fn().mockResolvedValue(true)
}));

// Mock logger
jest.mock('../../../core/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock bcryptjs
const mockBcrypt = {
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
};
jest.mock('bcryptjs', () => ({ default: mockBcrypt }));

// Mock jsonwebtoken
const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn().mockReturnValue({ id: '507f1f77bcf86cd799439011' }),
  decode: jest.fn()
};
jest.mock('jsonwebtoken', () => ({ default: mockJwt }));

// Create comprehensive User mock
const createUserMock = () => {
  const mockUser = function(data = {}) {
    Object.assign(this, {
      _id: '507f1f77bcf86cd799439011',
      username: data?.username || 'testuser',
      email: data?.email || 'test@example.com',
      fullName: data?.fullName || { name: 'Test', surname: 'User' },
      role: data?.role || 'cittadino',
      password: data?.password || 'hashedPassword',
      canChangePassword: jest.fn().mockReturnValue(true),
      save: jest.fn().mockResolvedValue(this),
      toObject: jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439011',
        username: data?.username || 'testuser',
        email: data?.email || 'test@example.com',
        fullName: data?.fullName || { name: 'Test', surname: 'User' },
        role: data?.role || 'cittadino'
      })
    });
  };

  // Static methods
  mockUser.find = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: 'user1', username: 'user1', email: 'user1@example.com' },
        { _id: 'user2', username: 'user2', email: 'user2@example.com' }
      ])
    })
  });

  mockUser.findOne = jest.fn().mockResolvedValue(null);
  
  mockUser.findById = jest.fn().mockImplementation((id) => {
    if (id === 'user456') {
      return Promise.resolve({ _id: 'user456', role: 'cittadino' });
    }
    return {
      select: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        role: 'cittadino',
        password: 'hashedPassword',
        canChangePassword: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true)
      })
    };
  });

  mockUser.findByIdAndUpdate = jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: 'user456',
      role: 'operatore_comunale',
      toObject: jest.fn().mockReturnValue({
        _id: 'user456',
        role: 'operatore_comunale'
      })
    })
  });

  mockUser.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'user456' });
  mockUser.create = jest.fn();
  mockUser.deleteMany = jest.fn();
  mockUser.updateMany = jest.fn();
  mockUser.countDocuments = jest.fn();
  mockUser.aggregate = jest.fn();

  return mockUser;
};

// Create Token mock
const createTokenMock = () => ({
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue([{
      user: { _id: '507f1f77bcf86cd799439011' },
      verifyToken: jest.fn().mockResolvedValue(true),
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    }])
  }),
  findOne: jest.fn().mockResolvedValue({
    revoked: false,
    save: jest.fn().mockResolvedValue(true)
  }),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn().mockResolvedValue(true),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
  revokeAllUserTokens: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
  hashToken: jest.fn(),
  generateToken: jest.fn()
});

// Create AuthService mock
const createAuthServiceMock = () => ({
  generateTokens: jest.fn().mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token'
  }),
  verifyToken: jest.fn(),
  refreshToken: jest.fn()
});

// Apply mocks
const mockUser = createUserMock();
const mockToken = createTokenMock();
const mockAuthService = createAuthServiceMock();

jest.mock('../../auth/models/User.js', () => ({
  default: mockUser
}));

jest.mock('../../auth/models/Token.js', () => ({
  default: mockToken
}));

jest.mock('../../auth/services/AuthService.js', () => ({
  default: mockAuthService
}));

// Import the controller functions after mocking
const { 
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
} = await import('../../auth/controllers/userController.js');

describe('UserController', () => {
  let req, res;

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
        _id: '507f1f77bcf86cd799439011',
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
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset User mock
    mockUser.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { _id: 'user1', username: 'user1', email: 'user1@example.com' },
          { _id: 'user2', username: 'user2', email: 'user2@example.com' }
        ])
      })
    });
    
    mockUser.findOne.mockResolvedValue(null);
    
    mockUser.findById.mockImplementation((id) => {
      if (id === 'user456') {
        return Promise.resolve({ _id: 'user456', role: 'cittadino' });
      }
      return {
        select: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          role: 'cittadino',
          password: 'hashedPassword',
          canChangePassword: jest.fn().mockReturnValue(true),
          save: jest.fn().mockResolvedValue(true)
        })
      };
    });
    
    mockUser.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'user456',
        role: 'operatore_comunale',
        toObject: jest.fn().mockReturnValue({
          _id: 'user456',
          role: 'operatore_comunale'
        })
      })
    });
    
    mockUser.findByIdAndDelete.mockResolvedValue({ _id: 'user456' });
    
    // Reset Token mock
    mockToken.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([{
        user: { _id: '507f1f77bcf86cd799439011' },
        verifyToken: jest.fn().mockResolvedValue(true),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }])
    });
    
    mockToken.findOne.mockResolvedValue({
      revoked: false,
      save: jest.fn().mockResolvedValue(true)
    });
    
    mockToken.revokeAllUserTokens.mockResolvedValue({ modifiedCount: 2 });
    
    // Reset AuthService mock
    mockAuthService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    });

    // Reset bcrypt and jwt mocks
    mockBcrypt.genSalt.mockResolvedValue('salt');
    mockBcrypt.hash.mockResolvedValue('hashedPassword');
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.verify.mockReturnValue({ id: '507f1f77bcf86cd799439011' });
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
      req.params.userId = '507f1f77bcf86cd799439011'; // Same as req.user._id

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
      req.params.userId = '507f1f77bcf86cd799439011'; // Same as req.user._id

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

    test('should return 404 when user not found', async () => {
      mockUser.findById.mockResolvedValue(null);

      await updateUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Utente non trovato' });
    });

    test('should handle database errors', async () => {
      mockUser.findById.mockRejectedValue(new Error('Database error'));

      await updateUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Errore nell\'aggiornamento dell\'utente' });
    });
  });

  describe('login', () => {
    test('should login successfully', async () => {
      const mockUserData = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        fullName: { name: 'Test', surname: 'User' },
        role: 'cittadino',
        save: jest.fn().mockResolvedValue(true)
      };

      req.user = mockUserData;
      mockAuthService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          fullName: { name: 'Test', surname: 'User' },
          role: 'cittadino'
        }
      });
    });

    test('should return 401 when no user in request', async () => {
      req.user = null;

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenziali non valide' });
    });

    test('should handle token generation errors', async () => {
      const mockUserData = {
        _id: '507f1f77bcf86cd799439011',
        save: jest.fn().mockResolvedValue(true)
      };

      req.user = mockUserData;
      mockAuthService.generateTokens.mockRejectedValue(new Error('Token error'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Errore durante la generazione del token' });
    });
  });

  describe('refreshTokenHandler', () => {
    test('should refresh token successfully', async () => {
      const mockTokenData = {
        user: { _id: '507f1f77bcf86cd799439011' },
        verifyToken: jest.fn().mockResolvedValue(true),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      };

      mockJwt.verify.mockReturnValue({ id: '507f1f77bcf86cd799439011' });
      mockToken.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockTokenData])
      });
      mockAuthService.generateTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
      mockToken.findByIdAndUpdate.mockResolvedValue(true);

      req.body = { refreshToken: 'valid-refresh-token' };

      await refreshTokenHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900
      });
    });

    test('should return 400 for missing refresh token', async () => {
      req.body = {};

      await refreshTokenHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token mancante' });
    });

    test('should return 401 for invalid refresh token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      req.body = { refreshToken: 'invalid-token' };

      await refreshTokenHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token non valido' });
    });

    test('should return 401 when no valid token found', async () => {
      mockJwt.verify.mockReturnValue({ id: '507f1f77bcf86cd799439011' });
      mockToken.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      req.body = { refreshToken: 'valid-refresh-token' };

      await refreshTokenHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token non valido' });
    });
  });

  describe('register', () => {
    test('should register user successfully', async () => {
      mockUser.findOne.mockResolvedValue(null);
      mockBcrypt.genSalt.mockResolvedValue('salt');
      mockBcrypt.hash.mockResolvedValue('hashedPassword');

      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: { name: 'Test', surname: 'User' }
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registrazione completata con successo',
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          fullName: { name: 'Test', surname: 'User' }
        }
      });
    });

    test('should return 400 for invalid password', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        fullName: { name: 'Test', surname: 'User' }
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale[!@#$%^&*]'
      });
    });

    test('should return 400 for existing user', async () => {
      mockUser.findOne.mockResolvedValue({ email: 'test@example.com' });

      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: { name: 'Test', surname: 'User' }
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Un utente con questa email o username esiste già'
      });
    });

    test('should return 400 for missing fullName', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: { name: 'Test' } // Missing surname
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Nome e cognome sono obbligatori'
      });
    });

    test('should handle database errors', async () => {
      mockUser.findOne.mockRejectedValue(new Error('Database error'));

      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: { name: 'Test', surname: 'User' }
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Si è verificato un errore durante la registrazione. Riprova più tardi.'
      });
    });
  });

  describe('profile_update', () => {
    test('should update profile successfully', async () => {
      const updatedUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'newusername',
        email: 'test@example.com',
        fullName: { name: 'Updated', surname: 'User' },
        role: 'cittadino'
      };

      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser)
      });

      req.body = {
        username: 'newusername',
        fullName: { name: 'Updated', surname: 'User' }
      };

      await profile_update(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Profilo aggiornato con successo',
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'newusername',
          email: 'test@example.com',
          fullName: { name: 'Updated', surname: 'User' },
          role: 'cittadino'
        }
      });
    });

    test('should return 400 for missing fullName fields', async () => {
      req.body = { fullName: { name: 'Test' } }; // Missing surname

      await profile_update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Nome e cognome sono obbligatori'
      });
    });

    test('should return 400 for short username', async () => {
      req.body = {
        username: 'ab', // Too short
        fullName: { name: 'Test', surname: 'User' }
      };

      await profile_update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Username deve avere almeno 3 caratteri'
      });
    });

    test('should return 404 when user not found', async () => {
      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      req.body = {
        fullName: { name: 'Test', surname: 'User' }
      };

      await profile_update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Utente non trovato' });
    });

    test('should handle database errors', async () => {
      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      req.body = {
        fullName: { name: 'Test', surname: 'User' }
      };

      await profile_update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Errore durante l\'aggiornamento del profilo' });
    });
  });

  describe('changePassword', () => {
    test('should change password successfully', async () => {
      const mockUserData = {
        _id: '507f1f77bcf86cd799439011',
        password: 'oldHashedPassword',
        canChangePassword: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData)
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.genSalt.mockResolvedValue('salt');
      mockBcrypt.hash.mockResolvedValue('newHashedPassword');
      mockToken.revokeAllUserTokens.mockResolvedValue({ modifiedCount: 2 });

      await changePassword(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Password cambiata con successo' });
    });

    test('should return 400 for missing input validation', async () => {
      req.body = {}; // Empty body

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password attuale e nuova password sono obbligatorie'
      });
    });

    test('should return 400 for invalid new password', async () => {
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'weak'
      };

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale'
      });
    });

    test('should return 401 for missing user authentication', async () => {
      req.user = null; // No authenticated user

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Utente non autenticato'
      });
    });

    test('should return 404 when user not found', async () => {
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Utente non trovato' });
    });

    test('should return 400 when user cannot change password', async () => {
      const mockUserData = {
        canChangePassword: jest.fn().mockReturnValue(false)
      };

      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData)
      });

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Non puoi cambiare la password se hai effettuato l\'accesso con Google'
      });
    });

    test('should return 400 for wrong current password', async () => {
      const mockUserData = {
        password: 'oldHashedPassword',
        canChangePassword: jest.fn().mockReturnValue(true)
      };

      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData)
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Password attuale non corretta' });
    });

    test('should handle database errors', async () => {
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Errore durante il cambio password' });
    });
  });

  describe('user_delete', () => {
    test('should delete user successfully', async () => {
      mockUser.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
      mockUser.findByIdAndDelete.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
      mockToken.revokeAllUserTokens.mockResolvedValue({ modifiedCount: 2 });

      await user_delete(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Utente eliminato con successo'
      });

      expect(mockUser.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockToken.revokeAllUserTokens).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockUser.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 401 for missing user authentication', async () => {
      req.user = null; // No authenticated user
      
      await user_delete(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Utente non autenticato'
      });
    });

    test('should return 404 when user not found', async () => {
      mockUser.findById.mockResolvedValue(null);

      await user_delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Utente non trovato' });
    });

    test('should handle database errors', async () => {
      mockUser.findById.mockRejectedValue(new Error('Database error'));

      await user_delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Errore durante l\'eliminazione dell\'utente' });
    });
  });

  describe('logout', () => {
    test('should logout successfully with refresh token', async () => {
      const mockTokenData = {
        revoked: false,
        save: jest.fn().mockResolvedValue(true)
      };

      mockToken.findOne.mockResolvedValue(mockTokenData);

      req.body = { refreshToken: 'valid-refresh-token' };

      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Logout effettuato con successo' });
      expect(mockTokenData.revoked).toBe(true);
    });

    test('should logout all devices successfully', async () => {
      mockToken.revokeAllUserTokens.mockResolvedValue({ modifiedCount: 3 });

      req.body = { logoutAll: true };

      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Logout da tutti i dispositivi effettuato con successo' });
      expect(mockToken.revokeAllUserTokens).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 400 for missing refresh token', async () => {
      req.body = {}; // No refresh token
      
      await logout(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Refresh token mancante o specificare logoutAll'
      });
    });

    test('should handle token not found', async () => {
      mockToken.findOne.mockResolvedValue(null);

      req.body = { refreshToken: 'non-existent-token' };

      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Token non trovato o già revocato' });
    });

    test('should handle database errors', async () => {
      mockToken.findOne.mockRejectedValue(new Error('Database error'));

      req.body = { refreshToken: 'valid-refresh-token' };

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Errore durante il logout' });
    });
  });
}); 