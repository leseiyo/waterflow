import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapPin, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [googleMaps, setGoogleMaps] = useState(null);

  useEffect(() => {
    fetchOrder();
    initializeSocket();
    initializeMap();
  }, [orderId]); // Only depend on orderId to prevent infinite loop

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
      setOrder(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch order details');
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const io = require('socket.io-client');
    const socketInstance = io('http://localhost:5000');

    socketInstance.emit('join-order', orderId);

    socketInstance.on('order-status-updated', (data) => {
      if (data.orderId === orderId) {
        fetchOrder();
        toast.success(`Order status updated to: ${data.status}`);
      }
    });

    socketInstance.on('location-updated', (data) => {
      if (data.orderId === orderId) {
        updateMapLocation(data.location, data.distance);
      }
    });

    // no state stored for socket to avoid lint errors
    return () => {
      socketInstance.disconnect();
    };
  };

  const initializeMap = async () => {
    const loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
      version: 'weekly',
      libraries: ['places']
    });

    try {
      const google = await loader.load();
      setGoogleMaps(google);
      
      // eslint-disable-next-line no-undef
      const mapInstance = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 12,
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#a2daf2' }]
          }
        ]
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      toast.error('Failed to load map');
    }
  };

  const updateMapLocation = (location, distance) => {
    if (!map || !location.coordinates || !googleMaps) return;

    const position = {
      lat: location.coordinates[1],
      lng: location.coordinates[0]
    };

    // Update or create distributor marker
    if (markers.distributor) {
      markers.distributor.setPosition(position);
    } else {
      // eslint-disable-next-line no-undef
      const distributorMarker = new googleMaps.maps.Marker({
        position,
        map,
        title: 'Distributor Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });
      setMarkers(prev => ({ ...prev, distributor: distributorMarker }));
    }

    // Center map on distributor
    map.setCenter(position);

    // Update distance info
    if (distance) {
      setOrder(prev => ({
        ...prev,
        tracking: {
          ...prev.tracking,
          distance: distance
        }
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'preparing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'out_for_delivery':
        return <MapPin className="h-5 w-5 text-orange-500" />;
      case 'in_transit':
        return <MapPin className="h-5 w-5 text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'in_transit':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Live Tracking</h2>
              <div id="map" className="w-full h-96 rounded-lg"></div>
              
              {order.tracking.distance > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-blue-800">
                      Distance to delivery: {order.tracking.distance.toFixed(2)} km
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Order Status</h3>
              <div className="space-y-3">
                {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'in_transit', 'delivered'].map((status) => (
                  <div key={status} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      order.status === status ? 'bg-blue-600' : 
                      ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'in_transit', 'delivered'].indexOf(order.status) >= 
                      ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'in_transit', 'delivered'].indexOf(status) 
                        ? 'bg-green-600' : 'bg-gray-300'
                    }`}>
                      {getStatusIcon(status)}
                    </div>
                    <span className={`ml-3 ${
                      order.status === status ? 'font-semibold' : ''
                    }`}>
                      {status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Order Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Quantity:</span>
                  <span className="ml-2 font-medium">
                    {order.orderDetails.quantity} {order.orderDetails.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-2 font-medium">
                    ${order.pricing.totalAmount} {order.pricing.currency}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="ml-2 font-medium capitalize">
                    {order.payment.method.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    order.payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.payment.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Delivery Address:</span>
                  <p className="mt-1 text-sm">{order.deliveryLocation.address}</p>
                </div>
                {order.tracking.estimatedDeliveryTime && (
                  <div>
                    <span className="text-gray-600">Estimated Delivery:</span>
                    <p className="mt-1 text-sm">
                      {new Date(order.tracking.estimatedDeliveryTime).toLocaleString()}
                    </p>
                  </div>
                )}
                {order.tracking.actualDeliveryTime && (
                  <div>
                    <span className="text-gray-600">Actual Delivery:</span>
                    <p className="mt-1 text-sm">
                      {new Date(order.tracking.actualDeliveryTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Distributor Information */}
            {order.distributor && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Distributor</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{order.distributor.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rating:</span>
                    <span className="ml-2 font-medium">
                      {order.distributor.rating.average.toFixed(1)} ⭐ ({order.distributor.rating.count} reviews)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{order.distributor.contactInfo.phone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking; 