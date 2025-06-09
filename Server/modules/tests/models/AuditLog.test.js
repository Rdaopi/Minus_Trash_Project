import mongoose from 'mongoose';
import AuditLog from '../../audit/models/AuditLog.js';

describe('AuditLog Model', () => {
  it('should require action, ip, and device', async () => {
    const log = new AuditLog({});
    let err;
    try {
      await log.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.action).toBeDefined();
    expect(err.errors.ip).toBeDefined();
    expect(err.errors.device).toBeDefined();
  });

  it('should create a valid audit log', async () => {
    const log = new AuditLog({
      action: 'login',
      method: 'email',
      email: 'test@example.com',
      ip: '127.0.0.1',
      device: 'Chrome',
      user: new mongoose.Types.ObjectId()
    });
    await expect(log.validate()).resolves.toBeUndefined();
  });
}); 