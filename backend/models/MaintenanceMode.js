import mongoose from 'mongoose';

const maintenanceModeSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: false
  },
  enabledBy: {
    type: String,
    required: true
  },
  enabledAt: {
    type: Date,
    default: Date.now
  },
  expectedBackAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model('MaintenanceMode', maintenanceModeSchema);
