const { body } = require('express-validator');

// User validation rules
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Task validation rules
const validateTask = [
  body('tasks')
    .isArray({ min: 1 })
    .withMessage('At least one task is required'),
  
  body('tasks.*')
    .trim()
    .notEmpty()
    .withMessage('Task description cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Task description cannot exceed 500 characters'),
  
  body('expectedDeliveryDate')
    .isISO8601()
    .withMessage('Please provide a valid expected delivery date')
    .custom((value) => {
      const deliveryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        throw new Error('Expected delivery date cannot be in the past');
      }
      return true;
    }),
  
  body('assignedBy')
    .trim()
    .notEmpty()
    .withMessage('Assigned by field is required')
    .isLength({ max: 100 })
    .withMessage('Assigned by cannot exceed 100 characters'),
  
  body('currentStatus')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'overdue', 'cancelled'])
    .withMessage('Invalid status value'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority value'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('deliveredOn')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Please provide a valid delivery date')
];

const validateTaskUpdate = [
  body('tasks')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one task is required'),
  
  body('tasks.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task description cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Task description cannot exceed 500 characters'),
  
  body('expectedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid expected delivery date'),
  
  body('assignedBy')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assigned by field cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Assigned by cannot exceed 100 characters'),
  
  body('currentStatus')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'overdue', 'cancelled'])
    .withMessage('Invalid status value'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority value'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('deliveredOn')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid delivery date')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateTask,
  validateTaskUpdate
};