import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Package, DollarSign, User, Star } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getTransportIcon } from '../utils/helpers';

const OrderCard = ({ order, showActions = true, onStatusUpdate }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <Package className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'out_for_delivery':
        return <MapPin className="h-4 w-4" />;
      case 'in_transit':
        return <MapPin className="h-4 w-4" />;
      case 'delivered':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(order._id, newStatus);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.orderNumber}
          </h3>
          <p className="text-sm text-gray-600">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          <div className="flex items-center">
            {getStatusIcon(order.status)}
            <span className="ml-1">
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center mb-2">
            <Package className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Quantity:</span>
            <span className="ml-2 font-medium">
              {order.orderDetails.quantity} {order.orderDetails.unit}
            </span>
          </div>
          <div className="flex items-center mb-2">
            <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Total:</span>
            <span className="ml-2 font-medium">
              {formatCurrency(order.pricing.totalAmount, order.pricing.currency)}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Delivery:</span>
            <span className="ml-2 text-sm truncate">
              {order.deliveryLocation.address}
            </span>
          </div>
        </div>

        <div>
          {order.distributor && (
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Distributor:</span>
              <span className="ml-2 font-medium">{order.distributor.name}</span>
            </div>
          )}
          {order.distributor?.transportMode && (
            <div className="flex items-center mb-2">
              <span className="text-sm text-gray-600">Transport:</span>
              <span className="ml-2 text-sm">
                {getTransportIcon(order.distributor.transportMode)} {order.distributor.transportMode}
              </span>
            </div>
          )}
          {order.distributor?.rating && (
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm text-gray-600">Rating:</span>
              <span className="ml-2 text-sm">
                {order.distributor.rating.average.toFixed(1)} ({order.distributor.rating.count})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Info */}
      {order.tracking && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-600">Distance:</span>
              <span className="ml-2 font-medium">
                {order.tracking.distance ? `${order.tracking.distance.toFixed(2)} km` : 'N/A'}
              </span>
            </div>
            {order.tracking.estimatedDeliveryTime && (
              <div>
                <span className="text-gray-600">ETA:</span>
                <span className="ml-2 font-medium">
                  {formatDate(order.tracking.estimatedDeliveryTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          to={`/order/${order._id}/tracking`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Track Order →
        </Link>

        {showActions && onStatusUpdate && (
          <div className="flex space-x-2">
            {order.status === 'pending' && (
              <button
                onClick={() => handleStatusUpdate('confirmed')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            )}
            {order.status === 'confirmed' && (
              <button
                onClick={() => handleStatusUpdate('preparing')}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
              >
                Start Preparing
              </button>
            )}
            {order.status === 'preparing' && (
              <button
                onClick={() => handleStatusUpdate('out_for_delivery')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Out for Delivery
              </button>
            )}
            {order.status === 'out_for_delivery' && (
              <button
                onClick={() => handleStatusUpdate('delivered')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Mark Delivered
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard; 