import React, { memo, useMemo } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import { Package, CheckCircle, DollarSign, Star, Clock } from 'lucide-react';

const StatCard = memo(({ icon: Icon, title, value, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
      <div className={`flex items-center justify-center h-12 w-12 rounded-full mr-4 ${colorClasses[color] || colorClasses.blue}`}>
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// add helper
const formatCurrency = (v) => {
  const n = Number(v ?? 0);
  return isNaN(n) ? '0.00' : n.toFixed(2);
};

const OptimizedDashboardStats = memo(({ stats = {}, loading = false, type = 'consumer' }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} type="stats" />
        ))}
      </div>
    );
  }

  const cards = useMemo(() => {
    if (type === 'consumer') {
      return [
        { icon: Package, title: 'Total Orders', value: stats.totalOrders ?? 0, color: 'blue' },
        { icon: CheckCircle, title: 'Completed', value: stats.completedOrders ?? 0, color: 'green' },
        { icon: DollarSign, title: 'Total Spent', value: `$${formatCurrency(stats.totalSpent)}`, color: 'green' },
        { icon: Star, title: 'Avg Rating', value: stats.averageRating ? Number(stats.averageRating).toFixed(1) : 'N/A', color: 'yellow' }
      ];
    }

    return [
      { icon: Package, title: 'Total Orders', value: stats.totalOrders ?? 0, color: 'blue' },
      { icon: Clock, title: 'Pending', value: stats.pendingOrders ?? 0, color: 'yellow' },
      { icon: CheckCircle, title: 'Completed', value: stats.completedOrders ?? 0, color: 'green' },
      { icon: DollarSign, title: 'Earnings', value: `$${formatCurrency(stats.totalEarnings)}`, color: 'green' }
    ];
  }, [stats, type]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((c, i) => (
        <StatCard
          key={i}
          icon={c.icon}
          title={c.title}
          value={c.value}
          subtitle={c.subtitle}
          color={c.color}
        />
      ))}
    </div>
  );
});

OptimizedDashboardStats.displayName = 'OptimizedDashboardStats';

export default OptimizedDashboardStats;
