import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-current ${sizeClasses[size]} ${colorClasses[color]}`}></div>
      {text && (
        <p className={`mt-3 text-sm ${colorClasses[color]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// Skeleton loading components for better UX
export const DocumentCardSkeleton: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      <div className="w-4 h-4 bg-gray-200 rounded"></div>
    </div>
    <div className="mb-4">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="flex items-center justify-between">
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
  </div>
);

export const AnalysisCardSkeleton: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
);

export const ButtonSkeleton: React.FC<{ width?: string }> = ({ width = 'w-24' }) => (
  <div className={`h-10 bg-gray-200 rounded-lg animate-pulse ${width}`}></div>
);

export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`h-4 bg-gray-200 rounded animate-pulse ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      ></div>
    ))}
  </div>
);

export default LoadingSpinner;
