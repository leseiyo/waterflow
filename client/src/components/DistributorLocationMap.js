import React, { useState, useEffect } from 'react';
import GoogleMap from './GoogleMap';
import { MapPin, Users, Clock, DollarSign } from 'lucide-react';

const DistributorLocationMap = ({ 
  distributorLocation,
  nearbyConsumers = [],
  orders = [],
  apiKey,
  className = "w-full h-96",
  onLocationSelect
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(distributorLocation || { lat: 40.7128, lng: -74.0060 });

  useEffect(() => {
    if (distributorLocation) {
      setMapCenter(distributorLocation);
    }
  }, [distributorLocation]);

  const handleMapClick = (latLng) => {
    const location = {
      lat: latLng.lat(),
      lng: latLng.lng()
    };
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Create markers for the map
  const markers = [];

  // Add distributor location marker
  if (distributorLocation) {
    markers.push({
      position: distributorLocation,
      title: 'Your Location',
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
          <h3 class="font-semibold text-gray-900">Your Business Location</h3>
          <p class="text-sm text-gray-600">Water Distribution Center</p>
        </div>
      `
    });
  }

  // Add nearby consumers markers
  nearbyConsumers.forEach((consumer, index) => {
    if (consumer.location) {
      markers.push({
        position: consumer.location,
        title: `Consumer: ${consumer.name}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">C</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
        },
        infoWindow: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${consumer.name}</h3>
            <p class="text-sm text-gray-600">${consumer.phone}</p>
            <p class="text-sm text-gray-600">${consumer.address}</p>
            <div class="mt-2">
              <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                ${consumer.distance?.toFixed(1) || 'N/A'} km away
              </span>
            </div>
          </div>
        `
      });
    }
  });

  // Add order delivery locations
  orders.forEach((order, index) => {
    if (order.deliveryLocation) {
      const isCompleted = order.status === 'completed';
      const isInProgress = order.status === 'in-progress';
      
      markers.push({
        position: order.deliveryLocation,
        title: `Order: ${order._id?.slice(-6)}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="12" fill="${isCompleted ? '#10B981' : isInProgress ? '#3B82F6' : '#F59E0B'}" stroke="white" stroke-width="2"/>
              <text x="14" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">O</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(28, 28),
        },
        animation: isInProgress ? window.google.maps.Animation.BOUNCE : null,
        infoWindow: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">Order #${order._id?.slice(-6)}</h3>
            <p class="text-sm text-gray-600">Customer: ${order.consumer?.name}</p>
            <p class="text-sm text-gray-600">Quantity: ${order.quantity} ${order.unit}</p>
            <p class="text-sm text-gray-600">Amount: $${order.totalAmount}</p>
            <div class="mt-2">
              <span class="inline-block px-2 py-1 ${getOrderStatusColor(order.status)} text-xs rounded-full">
                ${order.status}
              </span>
            </div>
          </div>
        `
      });
    }
  });

  // Add selected location marker
  if (selectedLocation) {
    markers.push({
      position: selectedLocation,
      title: 'Selected Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      animation: window.google.maps.Animation.BOUNCE,
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">Selected Location</h3>
          <p class="text-sm text-gray-600">Click to set as your location</p>
        </div>
      `
    });
  }

  return (
    <div className="space-y-4">
      {/* Location Stats */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Service Area Overview</h3>
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };
                  setMapCenter(location);
                  setSelectedLocation(location);
                  if (onLocationSelect) {
                    onLocationSelect(location);
                  }
                });
              }
            }}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <MapPin className="h-4 w-4 mr-1" />
            Use Current Location
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Nearby Consumers</p>
              <p className="text-sm text-gray-500">{nearbyConsumers.length} in area</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active Orders</p>
              <p className="text-sm text-gray-500">{orders.filter(o => o.status === 'in-progress').length} in progress</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Today's Revenue</p>
              <p className="text-sm text-gray-500">
                ${orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">Service Area Map</h4>
          <p className="text-sm text-gray-500">Click on the map to select a location or view customer orders</p>
        </div>
        <GoogleMap
          center={mapCenter}
          zoom={13}
          markers={markers}
          onMapClick={handleMapClick}
          apiKey={apiKey}
          className={className}
        />
      </div>
    </div>
  );
};

export default DistributorLocationMap;
