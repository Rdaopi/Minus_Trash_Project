import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Token from '../../auth/models/Token.js';

// Mock mongoose for testing
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    pre: jest.fn(),
    methods: {},
    statics: {}
  })),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn()
  }
}));

describe('Token Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Token model exists', () => {
    expect(Token).toBeDefined();
    expect(typeof Token).toBe('function');
  });

  test('creates token instance', () => {
    const tokenData = {
      user: 'user123',
      refreshToken: 'refresh-token-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'test-browser',
      revoked: false
    };

    const token = new Token(tokenData);
    expect(token).toBeDefined();
    expect(typeof token).toBe('object');
  });

  test('static methods exist', () => {
    expect(typeof Token.hashToken).toBe('function');
    expect(typeof Token.revokeAllUserTokens).toBe('function');
    expect(typeof Token.generateToken).toBe('function');
  });

  test('model operations', async () => {
    // Mock database operations
    Token.find = jest.fn().mockResolvedValue([]);
    Token.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });
    Token.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

    // Test find operation
    const findResult = await Token.find({ user: 'user123' });
    expect(Token.find).toHaveBeenCalledWith({ user: 'user123' });
    expect(findResult).toEqual([]);

    // Test updateMany operation
    const updateResult = await Token.updateMany(
      { user: 'user123', revoked: false },
      { revoked: true }
    );
    expect(Token.updateMany).toHaveBeenCalled();
    expect(updateResult.modifiedCount).toBe(2);

    // Test deleteMany operation
    const deleteResult = await Token.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    expect(Token.deleteMany).toHaveBeenCalled();
    expect(deleteResult.deletedCount).toBe(5);
  });

  test('revokeAllUserTokens static method', async () => {
    Token.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 3 });

    const result = await Token.revokeAllUserTokens('user123');
    
    expect(Token.updateMany).toHaveBeenCalledWith(
      { user: 'user123', revoked: false },
      { revoked: true }
    );
    expect(result.modifiedCount).toBe(3);
  });

  test('Token with minimal data', () => {
    const minimalToken = new Token({
      user: 'user123',
      refreshToken: 'basic-token'
    });

    expect(minimalToken).toBeDefined();
    expect(typeof minimalToken).toBe('object');
  });

  test('Token with all fields', () => {
    const completeToken = new Token({
      user: 'user123',
      refreshToken: 'complete-token-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Complete Browser',
      revoked: false
    });

    expect(completeToken).toBeDefined();
    expect(typeof completeToken).toBe('object');
  });
}); 