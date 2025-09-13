import React, { memo } from 'react';
import { Package, Clock, Star, MapPin, TrendingUp, DollarSign, Users, CheckCircle } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';

const StatCard = memo(({ icon: Icon, title, value, subtitle, color = 'blue', loading = false }) => {
  if (loading) {
    return <LoadingSkeleton type="stats" />;
  }

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

const OptimizedDashboardStats = memo(({ 
  stats, 
  loading = false, 
  type = 'consumer' // 'consumer' or 'distributor'
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} type="stats" />
        ))}
      </div>
    );
  }

  if (type === 'consumer') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Package}
          title="Total Orders"
          value={stats.totalOrders || 0}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed"
          value={stats.completedOrders || 0}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          title="Total Spent"
          value={`$${stats.totalSpent || 0}`}
          color="green"
        />
        <StatCard
          icon={Star}
          title="Avg Rating"
          value={stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
          color="yellow"
        />
      </div>
    );
  }

  // Distributor stats
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={Package}
        title="Total Orders"
        value={stats.totalOrders || 0}
        color="blue"
      />
      <StatCard
        icon={Clock}
        title="Pending"
        value={stats.pendingOrders || 0}
        color="yellow"
      />
      <StatCard
        icon={CheckCircle}
        title="Completed"
        value={stats.completedOrders || 0}
        color="green"
      />
      <StatCard
        icon={DollarSign}
        title="Earnings"
        value={`$${stats.totalEarnings || 0}`}
        color="green"
      />
    </div>
  );
});

OptimizedDashboardStats.displayName = 'OptimizedDashboardStats';

export default OptimizedDashboardStats;
