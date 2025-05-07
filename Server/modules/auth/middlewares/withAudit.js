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

            await auditService.logEvent({
                action,
                user: req.user?._id,
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
        await auditService.logFailedAttempt(action, error, {
            ip: req.ip,
            device: req.headers['user-agent'],
            identifier: req.user?.email || req.body?.email
        });
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