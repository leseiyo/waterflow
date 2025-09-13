import React, { useState, useEffect } from 'react';
import GoogleMap from './GoogleMap';
import { Truck, MapPin, Clock, Navigation } from 'lucide-react';

const OrderTrackingMap = ({ 
  order, 
  distributorLocation, 
  consumerLocation, 
  currentLocation,
  apiKey,
  className = "w-full h-96"
}) => {
  const [trackingData, setTrackingData] = useState({
    estimatedArrival: null,
    distance: null,
    deliveryStatus: 'preparing'
  });

  useEffect(() => {
    if (order && distributorLocation && consumerLocation) {
      // Calculate estimated arrival time (mock calculation)
      const estimatedTime = calculateEstimatedTime(distributorLocation, consumerLocation);
      const distance = calculateDistance(distributorLocation, consumerLocation);
      
      setTrackingData({
        estimatedArrival: estimatedTime,
        distance: distance,
        deliveryStatus: order.status || 'preparing'
      });
    }
  }, [order, distributorLocation, consumerLocation]);

  const calculateEstimatedTime = (from, to) => {
    // Mock calculation - in real app, use Google Maps Distance Matrix API
    const distance = calculateDistance(from, to);
    const averageSpeed = 30; // km/h
    const timeInHours = distance / averageSpeed;
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + timeInHours * 60 * 60 * 1000);
    return arrivalTime;
  };

  const calculateDistance = (from, to) => {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case 'preparing':
        return 'text-yellow-600 bg-yellow-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDeliveryStatusText = (status) => {
    switch (status) {
      case 'preparing':
        return 'Preparing for delivery';
      case 'in-progress':
        return 'On the way';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Unknown status';
    }
  };

  // Create markers for the map
  const markers = [
    {
      position: distributorLocation,
      title: 'Distributor Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">D</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">Distributor</h3>
          <p class="text-sm text-gray-600">${order?.distributor?.name || 'Water Distributor'}</p>
          <p class="text-sm text-gray-600">${order?.distributor?.phone || 'N/A'}</p>
        </div>
      `
    },
    {
      position: consumerLocation,
      title: 'Delivery Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#10B981" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">H</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">Delivery Address</h3>
          <p class="text-sm text-gray-600">${order?.deliveryAddress || 'Your address'}</p>
        </div>
      `
    }
  ];

  // Add current location marker if available
  if (currentLocation) {
    markers.push({
      position: currentLocation,
      title: 'Current Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">T</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      animation: window.google.maps.Animation.BOUNCE,
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">Delivery Truck</h3>
          <p class="text-sm text-gray-600">Currently here</p>
        </div>
      `
    });
  }

  // Calculate map center
  const mapCenter = distributorLocation && consumerLocation ? {
    lat: (distributorLocation.lat + consumerLocation.lat) / 2,
    lng: (distributorLocation.lng + consumerLocation.lng) / 2
  } : distributorLocation || consumerLocation || { lat: 40.7128, lng: -74.0060 };

  return (
    <div className="space-y-4">
      {/* Tracking Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Order Tracking</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDeliveryStatusColor(trackingData.deliveryStatus)}`}>
            {getDeliveryStatusText(trackingData.deliveryStatus)}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Order #{order?._id?.slice(-6) || 'N/A'}</p>
              <p className="text-sm text-gray-500">{order?.quantity} {order?.unit}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Estimated Arrival</p>
              <p className="text-sm text-gray-500">
                {trackingData.estimatedArrival ? 
                  trackingData.estimatedArrival.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                  'Calculating...'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Navigation className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Distance</p>
              <p className="text-sm text-gray-500">
                {trackingData.distance ? `${trackingData.distance.toFixed(1)} km` : 'Calculating...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <GoogleMap
          center={mapCenter}
          zoom={13}
          markers={markers}
          apiKey={apiKey}
          className={className}
        />
      </div>
    </div>
  );
};

export default OrderTrackingMap;
