import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation } from 'react-query';
import { taskAPI } from '../../services/api';
import { X, Plus, Trash2, Save, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const TaskForm = ({ task, onClose, onSuccess }) => {
  const isEditing = !!task;
  const [selectedDate, setSelectedDate] = useState(
    task ? new Date(task.expectedDeliveryDate) : new Date()
  );
  const [deliveredDate, setDeliveredDate] = useState(
    task && task.deliveredOn ? new Date(task.deliveredOn) : null
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      tasks: task ? task.tasks.map(t => ({ value: t })) : [{ value: '' }],
      assignedBy: task?.assignedBy || '',
      currentStatus: task?.currentStatus || 'pending',
      priority: task?.priority || 'medium',
      notes: task?.notes || '',
      expectedDeliveryDate: task ? new Date(task.expectedDeliveryDate) : new Date(),
      deliveredOn: task && task.deliveredOn ? new Date(task.deliveredOn) : null
    }
  });
//    {console.log(taskData)}

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tasks'
  });

  const currentStatus = watch('currentStatus');

  // Create/Update task mutation
  const taskMutation = useMutation(
    (data) => isEditing 
      ? taskAPI.updateTask(task._id, data)
      : taskAPI.createTask(data),
    {
        
      onSuccess: () => {
        toast.success(`Task ${isEditing ? 'updated' : 'created'} successfully!`);
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} task`);
      }
    }

  );

  const onSubmit = (data) => {
    console.log("Form data before processing:", data);
    // Transform tasks array
    const taskData = {
      ...data,
      tasks: data.tasks.map(t => t.value).filter(t => t.trim() !== ''),
      expectedDeliveryDate: selectedDate.toISOString(),
      deliveredOn: deliveredDate ? deliveredDate.toISOString() : null
    };

    // Remove deliveredOn if status is not completed
    if (taskData.currentStatus !== 'completed') {
      taskData.deliveredOn = null;
    }
    console.log("Payload being sent:", taskData);
    taskMutation.mutate(taskData);
  };
 
  const addTaskItem = () => {
    append({ value: '' });
  };

  const removeTaskItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Auto-set delivered date when status changes to completed
  useEffect(() => {
    if (currentStatus === 'completed' && !deliveredDate) {
      setDeliveredDate(new Date());
    }
  }, [currentStatus, deliveredDate]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Task Items */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasks <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        {...register(`tasks.${index}.value`, {
                          required: 'Task description is required',
                          maxLength: {
                            value: 500,
                            message: 'Task description cannot exceed 500 characters'
                          }
                        })}
                        type="text"
                        placeholder={`Task ${index + 1}`}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.tasks?.[index]?.value && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.tasks[index].value.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTaskItem(index)}
                      disabled={fields.length === 1}
                      className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addTaskItem}
                className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </button>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assigned By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned By <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('assignedBy', {
                    required: 'Assigned by is required',
                    maxLength: {
                      value: 100,
                      message: 'Cannot exceed 100 characters'
                    }
                  })}
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter assignee name"
                />
                {errors.assignedBy && (
                  <p className="mt-1 text-sm text-red-600">{errors.assignedBy.message}</p>
                )}
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholderText="Select delivery date"
                    dateFormat="MMM dd, yyyy"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register('currentStatus')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Delivered On (only show if status is completed) */}
              {currentStatus === 'completed' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivered On
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={deliveredDate}
                      onChange={(date) => setDeliveredDate(date)}
                      maxDate={new Date()}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholderText="Select delivery date"
                      dateFormat="MMM dd, yyyy"
                    />
                    <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes', {
                  maxLength: {
                    value: 1000,
                    message: 'Notes cannot exceed 1000 characters'
                  }
                })}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional notes or comments..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={taskMutation.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {taskMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Task' : 'Create Task'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;