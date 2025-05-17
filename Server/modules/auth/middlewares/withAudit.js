import auditService from '../../audit/services/audit.service.js';

export const withAudit = (options) => async (req, res, next) => {

    //Data dell'audit
    const startTime = Date.now();

    //Metodo di registrazione
    const { action, getMetadata = () => ({}) } = options;

    const originalJson = res.json;

    res.json = async (body) => {
        try {
            const statusType = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failed';
            
            // For registration, we'll get the user ID from the response body
            const userId = action === 'user_registration' && body.id ? body.id : req.user?._id;

            await auditService.logEvent({
                action,
                user: userId, // This will be undefined for registration until user is created
                status: statusType,
                ip: req.ip,
                device: req.headers['user-agent'],
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
                identifier: req.body?.email || 'unknown'
            });
        } else {
            await auditService.logFailedAttempt(action, error, {
                ip: req.ip,
                device: req.headers['user-agent'],
                identifier: req.user?.email || req.body?.email
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