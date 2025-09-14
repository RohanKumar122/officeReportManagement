const express = require('express');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const {
  validateTask,
  validateTaskUpdate
} = require('../middleware/validators');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', getTaskStats);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', validateTask, createTask);

// @route   GET /api/tasks
// @desc    Get all tasks for user with filtering and pagination
// @access  Private
router.get('/', getTasks);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', getTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', validateTaskUpdate, updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', deleteTask);

module.exports = router;