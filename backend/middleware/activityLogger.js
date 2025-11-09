import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (req, action, entityType, entityId, changes, description) => {
  try {
    await ActivityLog.create({
      action,
      entityType,
      entityId,
      registerId: req.user?.registerId,
      userName: req.user?.name || 'NA',
      changes,
      description
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const createLogMiddleware = (entityType, action, getDescription) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    const derivePayload = (body) => {
      if (body === undefined || body === null) return null;

      if (typeof body === 'object' && !Buffer.isBuffer(body)) {
        return body;
      }

      if (typeof body === 'string') {
        try {
          return JSON.parse(body);
        } catch {
          return null;
        }
      }

      if (Buffer.isBuffer(body)) {
        try {
          return JSON.parse(body.toString('utf8'));
        } catch {
          return null;
        }
      }

      return null;
    };
    
    const logIfNeeded = (payload) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            const description = typeof getDescription === 'function' 
              ? getDescription(req, payload)
              : getDescription;

            const entityId = req.params.id || req.params.userId || req.params.paymentId || 
                           (payload && payload._id) || 'unknown';

            let changes = { before: null, after: null };
            
            if (action === 'UPDATE' && req.originalData) {
              changes.before = req.originalData;
              changes.after = payload;
            } else if (action === 'CREATE') {
              changes.after = payload;
            } else if (action === 'DELETE' && req.originalData) {
              changes.before = req.originalData;
            }

            await logActivity(req, action, entityType, entityId, changes, description);
          } catch (error) {
            console.error('Logging middleware error:', error);
          }
        });
      }
    };

    res.send = function(data) {
      const parsedData = derivePayload(data);
      logIfNeeded(parsedData);
      originalSend.call(this, data);
    };

    res.json = function(body) {
      const parsedData = derivePayload(body);
      logIfNeeded(parsedData);
      return originalJson.call(this, body);
    };
    
    next();
  };
};
