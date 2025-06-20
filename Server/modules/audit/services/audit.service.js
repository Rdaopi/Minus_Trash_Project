// modules/audit/services/audit.service.js
import AuditLog from '../models/AuditLog.js';
import { logger } from '../../../core/utils/logger.js';

// Utility function to create standardized audit log data
const createAuditLogData = ({
  action,
  user,
  method,
  ip,
  device,
  email,
  status = 'success',
  metadata = {},
  initiator = null
}) => {
  const logData = {
    action,
    status,
    ip: ip || 'unknown',
    device: device || 'unknown',
    method,
    email,
    metadata: {
      ...metadata,
      timestamp: new Date()
    }
  };

  if (user) logData.user = user;
  if (initiator) logData.initiator = initiator;

  return logData;
};

const auditService = {
  /**
   * Registra un evento di audit completo
   * @param {Object} params - Parametri dell'evento
   * @param {String} params.action - Tipo azione (es: 'user_delete')
   * @param {ObjectId} [params.user] - Utente target (obbligatorio per azioni non amministrative)
   * @param {ObjectId} [params.initiator] - Utente che ha scatenato l'azione (per operazioni amministrative)
   * @param {String} params.ip - Indirizzo IP richiedente
   * @param {String} params.device - User Agent/Dispositivo
   * @param {Object} [params.metadata] - Dettagli aggiuntivi
   * @param {Boolean} [params.success=true] - Esito dell'operazione
   * @param {String} [params.method] - Metodo utilizzato per l'operazione
   * @param {String} [params.email] - Email dell'utente coinvolto nell'azione
   */
  logEvent: async ({
    action,
    user,
    initiator,
    ip,
    device,
    metadata = {},
    success = true,
    method,
    email
  }) => {
    try {
      const logData = createAuditLogData({
        action,
        user,
        initiator,
        ip,
        device,
        method,
        email,
        status: success ? 'success' : 'failed',
        metadata
      });

      // Controllo consistenza per azioni amministrative
      if (action === 'user_delete' && !initiator) {
        throw new Error('Initiator required for admin actions');
      }

      const logEntry = await AuditLog.create(logData);

      logger.info(`[AUDIT] Evento registrato: ${action}`, {
        logId: logEntry._id,
        user: user?.toString(),
        initiator: initiator?.toString(),
        email: email
      });

      return logEntry;
    } catch (error) {
      logger.error(`[AUDIT] Errore registrazione evento ${action}: ${error.message}`, {
        errorStack: error.stack,
        action,
        user,
        initiator,
        email
      });
      throw new Error(`Errore registrazione audit: ${error.message}`);
    }
  },

  /**
   * Registra un tentativo fallito con dettagli tecnici
   * @param {String} action - Azione tentata
   * @param {Error} error - Oggetto errore
   * @param {Object} context - Contesto della richiesta
   * @param {String} context.ip - Indirizzo IP
   * @param {String} context.device - Dispositivo/User Agent
   * @param {String} context.identifier - Email o username dell'utente
   */
  logFailedAttempt: async (action, error, context) => {
    try {
        const method = context.identifier.includes('@') ? 'email' : 'username';
  
        const logEntry = await AuditLog.create({
            action: `failed_${action}`,
            method,
            status: 'failed',
            email: context.identifier,
            metadata: {
                identifier: context.identifier,
                error: error.message,
                timestamp: new Date()
            },
            ip: context.ip,
            device: context.device
        });

      logger.warn(`[AUDIT] Tentativo fallito registrato: ${action}`, {
        email: context.identifier,
        error: error.message,
        logId: logEntry._id,
      });

    } catch (loggingError) {
      logger.error(`[AUDIT] Fallito log tentativo fallito: ${loggingError.message}`, {
        originalError: error.message,
        action,
        email: context.identifier
      });
    }
  },

  /**
   * Recupera log per un utente specifico con paginazione
   * @param {ObjectId} userId - ID utente target
   * @param {Object} options - Opzioni di paginazione
   * @param {Number} [options.page=1] - Pagina corrente
   * @param {Number} [options.limit=50] - Risultati per pagina
   */
  getUserLogs: async (userId, { page = 1, limit = 50 } = {}) => {
    const skip = (page - 1) * limit;
    
    return AuditLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('initiator', 'email role')
      .lean();
  },

  /**
   * Cerca log per azione e intervallo temporale
   * @param {String} action - Azione da cercare
   * @param {Date} startDate - Data inizio
   * @param {Date} endDate - Data fine
   */
  searchLogsByAction: async (action, startDate, endDate) => {
    return AuditLog.find({
      action,
      timestamp: { 
        $gte: startDate, 
        $lte: endDate 
      }
    })
    .populate('user', 'email')
    .populate('initiator', 'email')
    .lean();
  },

  /**
   * Recupera tutte le azioni amministrative di un utente
   * @param {ObjectId} adminId - ID dell'admin/initiator
   */
  getAdminActions: async (adminId) => {
    return AuditLog.find({ initiator: adminId })
      .populate('user', 'email')
      .sort({ timestamp: -1 })
      .lean();
  }
};

export default auditService;