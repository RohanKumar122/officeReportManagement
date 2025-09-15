import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { taskAPI, exportAPI } from '../../services/api';
import { 
  Edit2, 
  Trash2, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

const TaskList = ({ 
  tasks, 
  loading, 
  pagination, 
  onPageChange, 
  onEditTask, 
  onTaskUpdate 
}) => {
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showTaskDetail, setShowTaskDetail] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const queryClient = useQueryClient();

  // Delete task mutation
  const deleteTaskMutation = useMutation(taskAPI.deleteTask, {
    onSuccess: () => {
      queryClient.invalidateQueries('tasks');
      queryClient.invalidateQueries('taskStats');
      toast.success('Task deleted successfully');
      if (onTaskUpdate) onTaskUpdate();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  });

  // Update task status mutation
  const updateTaskMutation = useMutation(
    ({ id, data }) => taskAPI.updateTask(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        queryClient.invalidateQueries('taskStats');
        toast.success('Task updated successfully');
        if (onTaskUpdate) onTaskUpdate();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update task');
      }
    }
  );

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleStatusChange = (taskId, newStatus) => {
    const updateData = { currentStatus: newStatus };
    if (newStatus === 'completed') {
      updateData.deliveredOn = new Date().toISOString();
    }
    updateTaskMutation.mutate({ id: taskId, data: updateData });
  };

  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task._id));
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      const response = await exportAPI.exportToExcel();
      
      if (response.data.success) {
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(response.data.data);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
        
        // Generate buffer
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        // Save file
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, `tasks_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        
        toast.success('Tasks exported successfully!');
      }
    } catch (error) {
      toast.error('Failed to export tasks');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      'in-progress': <AlertCircle className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      overdue: <XCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />
    };
    return icons[status] || icons.pending;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-500 mb-4">
          Get started by creating your first task.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Actions Bar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTasks.length === tasks.length && tasks.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Select all ({selectedTasks.length} selected)
              </span>
            </label>
          </div>
          
          <button
            onClick={handleExportToExcel}
            disabled={exportLoading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-1.5" />
            {exportLoading ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Task List */}
     <div className="space-y-4">
  {tasks.map((task) => (
    <div
      key={task._id}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between">
        {/* Checkbox + Task Items */}
        <div className="flex-1 min-w-0">
          <label className="inline-flex items-start gap-2">
            <input
              type="checkbox"
              checked={selectedTasks.includes(task._id)}
              onChange={() => handleSelectTask(task._id)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              {task.tasks.map((taskItem, index) => (
                <div
                  key={index}
                  className="text-gray-900 font-medium text-sm sm:text-base mb-1"
                >
                  • {taskItem}
                </div>
              ))}
            </div>
          </label>
        </div>

        {/* Status & Priority */}
        <div className="ml-3 flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
              task.currentStatus
            )}`}
          >
            {getStatusIcon(task.currentStatus)}
            <span className="ml-1 capitalize">
              {task.currentStatus.replace("-", " ")}
            </span>
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-gray-400" />
          Created: {format(new Date(task.taskCreatedDate), "MMM dd, yyyy")}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-400" />
          Due: {format(new Date(task.expectedDeliveryDate), "MMM dd, yyyy")}
        </div>
        <div className="flex items-center gap-1">
          <User className="h-4 w-4 text-gray-400" />
          {task.assignedBy}
        </div>
        {task.deliveredOn && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            {format(new Date(task.deliveredOn), "MMM dd, yyyy")}
          </div>
        )}
      </div>

      {/* Notes */}
      {task.notes && (
        <div className="mt-3 text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
          <strong>Notes:</strong> {task.notes}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap justify-between items-center gap-3">
        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTaskDetail(task)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEditTask(task)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit task"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteTask(task._id)}
            disabled={deleteTaskMutation.isLoading}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Status Dropdown */}
        <select
          value={task.currentStatus}
          onChange={(e) => handleStatusChange(task._id, e.target.value)}
          disabled={updateTaskMutation.isLoading}
          className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  ))}
</div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * 10 + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * 10, pagination.totalTasks)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalTasks}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page Numbers */}
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNumber = pagination.currentPage - 2 + i;
                    if (pageNumber < 1 || pageNumber > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => onPageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNumber === pagination.currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && (
        <TaskDetailModal 
          task={showTaskDetail} 
          onClose={() => setShowTaskDetail(null)} 
        />
      )}
    </div>
  );
};

// Task Detail Modal Component
const TaskDetailModal = ({ task, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tasks:</h4>
              <ul className="list-disc list-inside space-y-1">
                {task.tasks.map((taskItem, index) => (
                  <li key={index} className="text-gray-700">{taskItem}</li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-900">Created:</span>
                <p className="text-gray-700">{format(new Date(task.taskCreatedDate), 'PPP')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900">Due Date:</span>
                <p className="text-gray-700">{format(new Date(task.expectedDeliveryDate), 'PPP')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900">Assigned By:</span>
                <p className="text-gray-700">{task.assignedBy}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900">Status:</span>
                <p className="text-gray-700 capitalize">{task.currentStatus.replace('-', ' ')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900">Priority:</span>
                <p className="text-gray-700 capitalize">{task.priority}</p>
              </div>
              {task.deliveredOn && (
                <div>
                  <span className="font-medium text-gray-900">Delivered On:</span>
                  <p className="text-gray-700">{format(new Date(task.deliveredOn), 'PPP')}</p>
                </div>
              )}
            </div>
            
            {task.notes && (
              <div>
                <span className="font-medium text-gray-900">Notes:</span>
                <p className="text-gray-700 mt-1">{task.notes}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList;