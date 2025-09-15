import React from 'react';
import { CheckSquare } from 'lucide-react';

const LoadingSpinner = ({ size = 'large', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  const containerClasses = {
    small: 'p-4',
    medium: 'p-8',
    large: 'min-h-screen'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {/* Logo */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl animate-pulse">
          <CheckSquare className="h-8 w-8 text-white" />
        </div>
      </div>
      
      {/* Spinner
      <div className="flex items-center space-x-2">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
        <span className="text-gray-600 font-medium">{message}</span>
      </div>
       */}
      {/* Progress dots */}
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;