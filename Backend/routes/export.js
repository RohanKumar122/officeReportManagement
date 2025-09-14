const express = require('express');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/export/xlsx
// @desc    Export tasks to Excel format
// @access  Private
router.get('/xlsx', async (req, res) => {
  try {
    const {
      status,
      priority,
      dateFilter,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query (same as in getTasks)
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

    // Get all tasks matching the criteria
    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .sort({ taskCreatedDate: -1 });

    // Transform data for Excel export
    const excelData = tasks.map((task, index) => ({
      'S.No': index + 1,
      'Task Created Date': task.taskCreatedDate.toLocaleDateString(),
      'Tasks': task.tasks.join('; '),
      'Expected Delivery Date': task.expectedDeliveryDate.toLocaleDateString(),
      'Delivered On': task.deliveredOn ? task.deliveredOn.toLocaleDateString() : 'Not Delivered',
      'Assigned By': task.assignedBy,
      'Current Status': task.currentStatus.charAt(0).toUpperCase() + task.currentStatus.slice(1),
      'Priority': task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
      'Notes': task.notes || 'No notes',
      'Created By': task.createdBy.name
    }));

    res.json({
      success: true,
      data: excelData,
      totalRecords: excelData.length,
      exportDate: new Date().toISOString(),
      filters: {
        status,
        priority,
        dateFilter,
        startDate,
        endDate,
        search
      }
    });

  } catch (error) {
    console.error('Export tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting tasks'
    });
  }
});

module.exports = router;