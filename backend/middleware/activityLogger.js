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
    
    res.send = function(data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            const description = typeof getDescription === 'function' 
              ? getDescription(req, JSON.parse(data))
              : getDescription;
            
            const entityId = req.params.id || req.params.userId || req.params.paymentId || 
                           (JSON.parse(data)._id) || 'unknown';
            
            let changes = { before: null, after: null };
            
            if (action === 'UPDATE' && req.originalData) {
              changes.before = req.originalData;
              changes.after = JSON.parse(data);
            } else if (action === 'CREATE') {
              changes.after = JSON.parse(data);
            } else if (action === 'DELETE' && req.originalData) {
              changes.before = req.originalData;
            }

            await logActivity(req, action, entityType, entityId, changes, description);
          } catch (error) {
            console.error('Logging middleware error:', error);
          }
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};