import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { taskAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TaskList from './tasks/TaskList';
import TaskForm from './tasks/TaskForm';
import TaskStats from './tasks/TaskStats';
import Header from './layout/Header';
import { Plus, BarChart3, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    priority: 'all',
    dateFilter: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Fetch tasks
  const {
    data: tasksData,
    isLoading: tasksLoading,
    refetch: refetchTasks,
    error: tasksError
  } = useQuery(
    ['tasks', filters],
    () => taskAPI.getTasks(filters),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );

  // Fetch task statistics
  const {
    data: statsData,
    refetch: refetchStats
  } = useQuery(
    'taskStats',
    () => taskAPI.getTaskStats(),
    {
      staleTime: 60000, // 1 minute
    }
  );

  useEffect(() => {
    if (tasksError) {
      toast.error('Failed to load tasks');
    }
  }, [tasksError]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleTaskFormClose = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleTaskSuccess = () => {
    refetchTasks();
    refetchStats();
    handleTaskFormClose();
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your tasks today.
          </p>
        </div>

        {/* Task Statistics */}
        <div className="mb-8">
          <TaskStats data={statsData?.data?.stats} loading={!statsData} />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Task Management</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCreateTask}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <TaskFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Task List */}
          <TaskList
            tasks={tasksData?.data?.tasks || []}
            loading={tasksLoading}
            pagination={tasksData?.data?.pagination}
            onPageChange={handlePageChange}
            onEditTask={handleEditTask}
            onTaskUpdate={handleTaskSuccess}
          />
        </div>
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onClose={handleTaskFormClose}
          onSuccess={handleTaskSuccess}
        />
      )}
    </div>
  );
};

// Task Filters Component
const TaskFilters = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateFilterChange = (dateFilter) => {
    const newFilters = { ...localFilters, dateFilter };
    
    // Clear custom date range if not custom
    if (dateFilter !== 'custom') {
      newFilters.startDate = '';
      newFilters.endDate = '';
    }
    
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      ...filters,
      status: 'all',
      priority: 'all',
      dateFilter: '',
      startDate: '',
      endDate: '',
      search: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search tasks, assignee, or notes..."
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={localFilters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Priority Filter */}
        <select
          value={localFilters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Filter className="h-4 w-4 mr-2" />
          Advanced
        </button>

        {/* Reset Filters */}
        <button
          onClick={resetFilters}
          className="px-3 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        >
          Reset
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={localFilters.dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {localFilters.dateFilter === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;