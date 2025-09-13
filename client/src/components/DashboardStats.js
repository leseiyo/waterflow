import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Star } from 'lucide-react';

const DashboardStats = ({ stats, type = 'distributor' }) => {
  const getIcon = (metric) => {
    switch (metric) {
      case 'revenue':
        return <DollarSign className="h-6 w-6" />;
      case 'orders':
        return <Package className="h-6 w-6" />;
      case 'customers':
        return <Users className="h-6 w-6" />;
      case 'rating':
        return <Star className="h-6 w-6" />;
      default:
        return <TrendingUp className="h-6 w-6" />;
    }
  };

  const getColor = (metric) => {
    switch (metric) {
      case 'revenue':
        return 'bg-green-500';
      case 'orders':
        return 'bg-blue-500';
      case 'customers':
        return 'bg-purple-500';
      case 'rating':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(stats).map(([key, value]) => (
        <div key={key} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 capitalize">
                {key.replace('_', ' ')}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {key === 'revenue' ? `$${value.current.toLocaleString()}` : 
                 key === 'rating' ? value.current.toFixed(1) : 
                 value.current.toLocaleString()}
              </p>
              {value.trend !== undefined && (
                <div className="flex items-center mt-2">
                  {getTrendIcon(value.trend)}
                  <span className={`ml-1 text-sm font-medium ${getTrendColor(value.trend)}`}>
                    {Math.abs(value.trend)}% from last month
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${getColor(key)} text-white`}>
              {getIcon(key)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats; 