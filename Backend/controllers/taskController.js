const { validationResult } = require('express-validator');
const Task = require('../models/Task');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const taskData = {
      ...req.body,
      createdBy: req.user.id
    };

    const task = await Task.create(taskData);
    await task.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
};

// @desc    Get all tasks for user with filtering and pagination
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      dateFilter,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query
    let query = { createdBy: req.user.id };

    // Status filter
    if (status && status !== 'all') {
      query.currentStatus = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Date filters
    if (dateFilter) {
      const now = new Date();
      let dateQuery = {};

      switch (dateFilter) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          dateQuery = {
            taskCreatedDate: {
              $gte: today,
              $lt: tomorrow
            }
          };
          break;
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          weekStart.setHours(0, 0, 0, 0);
          dateQuery = {
            taskCreatedDate: { $gte: weekStart }
          };
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateQuery = {
            taskCreatedDate: { $gte: monthStart }
          };
          break;
        case 'custom':
          if (startDate && endDate) {
            dateQuery = {
              taskCreatedDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            };
          }
          break;
      }

      query = { ...query, ...dateQuery };
    }

    // Search filter
    if (search) {
      query.$or = [
        { tasks: { $regex: search, $options: 'i' } },
        { assignedBy: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get tasks with pagination
    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .sort({ taskCreatedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    res.json({
      success: true,
      tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTasks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting tasks'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    let task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // If status is being updated to completed and deliveredOn is not set
    if (req.body.currentStatus === 'completed' && !task.deliveredOn) {
      req.body.deliveredOn = new Date();
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Task.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments({ createdBy: userId });
    const overdueTasks = await Task.countDocuments({
      createdBy: userId,
      currentStatus: { $in: ['pending', 'in-progress'] },
      expectedDeliveryDate: { $lt: new Date() }
    });

    const statsObject = {
      total: totalTasks,
      overdue: overdueTasks,
      pending: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      statsObject[stat._id] = stat.count;
    });

    res.json({
      success: true,
      stats: statsObject
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting task statistics'
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getTaskStats
};