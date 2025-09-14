const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskCreatedDate: {
    type: Date,
    default: Date.now, // will store when task was created
    required: true
  },
  tasks: [{
    type: String,
    required: [true, 'At least one task is required'],
    trim: true,
    maxlength: [500, 'Task description cannot exceed 500 characters']
  }],
  expectedDeliveryDate: {
    type: Date,
    required: [true, 'Expected delivery date is required']
  },
  deliveredOn: {
    type: Date,
    default: null
  },
  assignedBy: {
    type: String,
    required: [true, 'Assigned by field is required'],
    trim: true,
    maxlength: [100, 'Assigned by cannot exceed 100 characters']
  },
  currentStatus: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ createdBy: 1, taskCreatedDate: -1 });
taskSchema.index({ currentStatus: 1 });
taskSchema.index({ expectedDeliveryDate: 1 });

// Virtual
taskSchema.virtual('isOverdue').get(function() {
  if (['completed', 'cancelled'].includes(this.currentStatus)) {
    return false;
  }
  return new Date() > this.expectedDeliveryDate;
});

// Pre-save hook
taskSchema.pre('save', function(next) {
  if (this.isOverdue && ['pending', 'in-progress'].includes(this.currentStatus)) {
    this.currentStatus = 'overdue';
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
