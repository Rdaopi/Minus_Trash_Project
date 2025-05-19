import mongoose from 'mongoose';
const { Schema } = mongoose;

const auditLogSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() 
      return !['user_registration', 'failed_login'].includes(this.action)
    }
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 
      'logout', 
      'profile_update', 
      'password_change', 
      'user_registration',
      'user_delete',
      'failed_login'
    ]
  },
  method: {
    type: String,
    enum: ['email', 'username', 'google'],
    required: function() {
      return ['login', 'failed_login'].includes(this.action);
    }
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.action === 'user_delete';
    }
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  ip: {
    type: String,
    required: true
  },
  device: {
    type: String,
    required: true
  },
  metadata: {
    oldValues: Schema.Types.Mixed,
    newValues: Schema.Types.Mixed,
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    errorDetails: {
      message: String,
      stack: String
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  // Ottimizzazioni prestazionali
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


auditLogSchema.index({ user: 1, action: 1, timestamp: -1 }); // Query utente
auditLogSchema.index({ initiator: 1, timestamp: -1 }); // Tracking admin
auditLogSchema.index({ 'metadata.targetUser': 1 }); // Ricerche cross-utente
auditLogSchema.index({ method: 1, action: 1, timestamp: 1 });

export default mongoose.model('AuditLog', auditLogSchema);