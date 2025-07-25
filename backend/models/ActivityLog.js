import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'RESTORE'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['User', 'Income', 'Expense', 'Payment', 'Collection', 'Moment', 'Game', 'Banner', 'EstimatedIncome', 'EstimatedExpense', 'HiddenProfile', 'Slide', 'Event', "Notification", 'PreviousYear', 'MaintenanceMode', 'DeveloperOptions'],
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  registerId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  changes: {
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  description: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Index for better query performance
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ registerId: 1 });
activityLogSchema.index({ entityType: 1 });
activityLogSchema.index({ action: 1 });

export default mongoose.model('ActivityLog', activityLogSchema);