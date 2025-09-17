import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AvailabilityManager = ({ isOpen, onClose, onAvailabilityUpdated }) => {
  const [availability, setAvailability] = useState({
    isOnline: false,
    workingHours: {
      monday: { start: '08:00', end: '18:00', enabled: true },
      tuesday: { start: '08:00', end: '18:00', enabled: true },
      wednesday: { start: '08:00', end: '18:00', enabled: true },
      thursday: { start: '08:00', end: '18:00', enabled: true },
      friday: { start: '08:00', end: '18:00', enabled: true },
      saturday: { start: '08:00', end: '16:00', enabled: true },
      sunday: { start: '08:00', end: '16:00', enabled: false }
    },
    maxOrdersPerDay: 20,
    serviceRadius: 10, // km
    currentLocation: null,
    autoAccept: false
  });
  const [loading, setLoading] = useState(false);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCurrentLocation();
    }
  }, [isOpen]);

  const fetchCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAvailability(prev => ({
            ...prev,
            currentLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your current location');
        }
      );
    }
  };

  const handleDayToggle = (day) => {
    setAvailability(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          enabled: !prev.workingHours[day].enabled
        }
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleInputChange = (field, value) => {
    setAvailability(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put('/api/distributors/availability', availability, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });

      toast.success('Availability updated successfully!');
      onClose();
      
      if (onAvailabilityUpdated) {
        onAvailabilityUpdated(response.data);
      }

    } catch (error) {
      toast.error('Failed to update availability');
      console.error('Availability update error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Manage Availability</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Online Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Online Status</h3>
                  <p className="text-sm text-gray-600">Make yourself available to receive orders</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('isOnline', !availability.isOnline)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    availability.isOnline ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      availability.isOnline ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Working Hours</h3>
              <div className="space-y-3">
                {days.map((day) => (
                  <div key={day.key} className="flex items-center space-x-4">
                    <div className="w-20">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={availability.workingHours[day.key].enabled}
                          onChange={() => handleDayToggle(day.key)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {day.label}
                        </span>
                      </label>
                    </div>
                    
                    {availability.workingHours[day.key].enabled && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={availability.workingHours[day.key].start}
                          onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={availability.workingHours[day.key].end}
                          onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Service Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Orders Per Day
                </label>
                <input
                  type="number"
                  value={availability.maxOrdersPerDay}
                  onChange={(e) => handleInputChange('maxOrdersPerDay', parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Radius (km)
                </label>
                <input
                  type="number"
                  value={availability.serviceRadius}
                  onChange={(e) => handleInputChange('serviceRadius', parseInt(e.target.value))}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Auto Accept */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Auto-Accept Orders</h3>
                  <p className="text-sm text-gray-600">Automatically accept orders within your capacity</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('autoAccept', !availability.autoAccept)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    availability.autoAccept ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      availability.autoAccept ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Current Location */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Current Location</h3>
                  <p className="text-sm text-gray-600">
                    {availability.currentLocation 
                      ? `Lat: ${availability.currentLocation.lat.toFixed(4)}, Lng: ${availability.currentLocation.lng.toFixed(4)}`
                      : 'Location not available'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchCurrentLocation}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Update Location
                </button>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;
