import mongoose from 'mongoose';
import Message from '../../message/message.model.js';

describe('Message Model', () => {
  it('should require content, sender, and at least one recipient', async () => {
    const msg = new Message({});
    let err;
    try {
      await msg.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.content).toBeDefined();
    expect(err.errors.sender).toBeDefined();
    expect(err.errors['recipients.0']).toBeDefined();
  });

  it('should create a valid message', async () => {
    const msg = new Message({
      content: 'Hello!',
      sender: new mongoose.Types.ObjectId(),
      recipients: [new mongoose.Types.ObjectId()]
    });
    await expect(msg.validate()).resolves.toBeUndefined();
  });
}); 