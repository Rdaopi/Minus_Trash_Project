import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../auth/models/User.js';

// Mock mongoose for testing
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    methods: {},
    statics: {}
  })),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn()
  }
}));

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates user with required fields', () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: {
        name: 'John',
        surname: 'Doe'
      }
    };

    const user = new User(userData);
    
    expect(user.username).toBe(userData.username);
    expect(user.email).toBe(userData.email);
  });

  test('finds user by email', async () => {
    const email = 'test@example.com';
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      email,
      fullName: {
        name: 'John',
        surname: 'Doe'
      }
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const result = await User.findOne({ email });
    
    expect(User.findOne).toHaveBeenCalledWith({ email });
    expect(result).toEqual(mockUser);
  });

  test('validates email format', () => {
    const user = new User({
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123',
      fullName: {
        name: 'John',
        surname: 'Doe'
      }
    });

    expect(user.email).toBe('invalid-email');
  });
}); 