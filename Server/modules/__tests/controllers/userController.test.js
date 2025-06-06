import { jest } from '@jest/globals';
import { getAllUsers, login, register } from '../../auth/controllers/userController.js';

describe('UserController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: { email: 'test@example.com', password: 'Password123!' },
      user: { role: 'amministratore' },
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('register function exists', () => {
    expect(typeof register).toBe('function');
  });

  test('login function exists', () => {
    expect(typeof login).toBe('function');
  });

  test('getAllUsers function exists', () => {
    expect(typeof getAllUsers).toBe('function');
  });
}); 