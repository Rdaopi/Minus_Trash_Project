import mongoose from 'mongoose';
const { Schema } = mongoose;

const auditLogSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'profile_update', 'password_change', 'user_registration']
  },
  method: {
    type: String,
    enum: ['local', 'google']
  },
  ip: String,
  device: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

export default mongoose.model('AuditLog', auditLogSchema);