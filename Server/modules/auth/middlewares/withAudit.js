import auditService from '../../audit/services/audit.service.js';

export const withAudit = (options) => async (req, res, next) => {

    //Data dell'audit
    const startTime = Date.now();

    //Metodo di registrazione
    const { action, getMetadata = () => ({}) } = options;

    const originalJson = res.json;

    res.json = async (body) => {
        try {
            const statusType = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failed'
            
            // For registration, we'll get the user ID from the response body
            const userId = action === 'user_registration' && body.user?.id ? body.user.id : req.user?._id;

            // Get email from request body for registration or from user object for other actions
            const email = action === 'user_registration' ? req.body?.email : req.user?.email;

            await auditService.logEvent({
                action,
                user: userId,
                status: statusType,
                ip: req.ip,
                device: req.headers['user-agent'],
                method: 'email',
                email: email,
                metadata: {
                    ...getMetadata(req, res),
                    statusCode: res.statusCode,
                    ...(statusType === 'failed' && { error: body.error })
                }
            });

        } catch (error) {
            //Utilizza il logger interno di auditService per errori di audit
            await auditService.logFailedAttempt('audit_failure', error, {
                ip: req.ip,
                device: req.headers['user-agent']
            });
        }

        return originalJson.call(res, body);
    };

    try {
        await next();
    } catch (error) {
        if (action === 'user_registration') {
            // For registration failures, we don't have a user yet
            await auditService.logFailedAttempt(action, error, {
                ip: req.ip,
                device: req.headers['user-agent'],
                identifier: req.body?.email || 'unknown',
                metadata: {
                    error: error.message
                }
            });
        } else {
            await auditService.logFailedAttempt(action, error, {
                ip: req.ip,
                device: req.headers['user-agent'],
                identifier: req.user?.email || req.body?.email,
                metadata: {
                    error: error.message
                }
            });
        }
        next(error);
    }
};

// Helper per operazioni comuni
export const auditOnSuccess = (action, metadataFields = []) => withAudit({
    action,
    getMetadata: (req) => metadataFields.reduce((acc, field) => ({
        ...acc,
        [field]: req.params[field] || req.body[field]
    }), {})
});