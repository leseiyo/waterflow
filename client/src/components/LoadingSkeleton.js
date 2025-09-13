import React from 'react';

export default function LoadingSkeleton({ type = 'card' }) {
  if (type === 'stats') {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-28 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-32" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-40 bg-gray-200 rounded" />
    </div>
  );
}
