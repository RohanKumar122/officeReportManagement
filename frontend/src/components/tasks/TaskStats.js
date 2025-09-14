import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  BarChart3,
  TrendingUp,
  TrendingDown 
} from 'lucide-react';

const TaskStats = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-soft p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Tasks',
      value: data.total || 0,
      icon: BarChart3,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      name: 'Completed',
      value: data.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      name: 'In Progress',
      value: data['in-progress'] || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      name: 'Overdue',
      value: data.overdue || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  ];

  const completionRate = data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : 0;
  const overdueRate = data.total > 0 ? ((data.overdue / data.total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            
            {/* Progress bar for visual representation */}
            {data.total > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${stat.color} transition-all duration-500`}
                    style={{
                      width: `${Math.min((stat.value / data.total) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.total > 0 ? ((stat.value / data.total) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800">
                Completion Rate
              </h3>
            </div>
            <span className="text-2xl font-bold text-green-700">
              {completionRate}%
            </span>
          </div>
          <p className="text-green-600 text-sm">
            {data.completed} out of {data.total} tasks completed
          </p>
          <div className="mt-3 w-full bg-green-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Overdue Rate */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-800">
                Overdue Rate
              </h3>
            </div>
            <span className="text-2xl font-bold text-red-700">
              {overdueRate}%
            </span>
          </div>
          <p className="text-red-600 text-sm">
            {data.overdue} out of {data.total} tasks are overdue
          </p>
          <div className="mt-3 w-full bg-red-200 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${overdueRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      {data.total > 0 && (
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                <strong>{data.pending || 0}</strong> tasks pending
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-gray-600">
                <strong>{data.cancelled || 0}</strong> tasks cancelled
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">
                Productivity: <strong>
                  {completionRate >= 80 ? 'Excellent' : 
                   completionRate >= 60 ? 'Good' : 
                   completionRate >= 40 ? 'Average' : 'Needs Improvement'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStats;