import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Star, Clock, Filter, X } from 'lucide-react';
import axios from 'axios';

const DistributorSearch = ({ onDistributorSelect, selectedLocation }) => {
  const [distributors, setDistributors] = useState([]);
  const [filteredDistributors, setFilteredDistributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minRating: 0,
    maxDistance: 50,
    waterType: '',
    transportMode: '',
    priceRange: { min: 0, max: 10 }
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDistributors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/distributors');
      setDistributors(response.data);
    } catch (error) {
      console.error('Failed to fetch distributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = distributors.filter(distributor => {
      // Search term filter
      if (searchTerm && !distributor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !distributor.address.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Rating filter
      if (distributor.rating < filters.minRating) {
        return false;
      }

      // Water type filter
      if (filters.waterType && !distributor.waterSupply.toLowerCase().includes(filters.waterType.toLowerCase())) {
        return false;
      }

      // Transport mode filter
      if (filters.transportMode && distributor.transportMode !== filters.transportMode) {
        return false;
      }

      // Distance filter (if location is provided)
      if (selectedLocation && distributor.location) {
        const distance = calculateDistance(selectedLocation, distributor.location);
        if (distance > filters.maxDistance) {
          return false;
        }
      }

      return true;
    });

    // Sort by rating and distance
    filtered.sort((a, b) => {
      if (selectedLocation && a.location && b.location) {
        const distanceA = calculateDistance(selectedLocation, a.location);
        const distanceB = calculateDistance(selectedLocation, b.location);
        return distanceA - distanceB;
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    setFilteredDistributors(filtered);
  }, [distributors, searchTerm, filters, selectedLocation]);

  const calculateDistance = (location1, location2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (location2.lat - location1.lat) * Math.PI / 180;
    const dLon = (location2.lng - location1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(location1.lat * Math.PI / 180) * Math.cos(location2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      minRating: 0,
      maxDistance: 50,
      waterType: '',
      transportMode: '',
      priceRange: { min: 0, max: 10 }
    });
    setSearchTerm('');
  };

  const getDistanceText = (distributor) => {
    if (!selectedLocation || !distributor.location) return '';
    const distance = calculateDistance(selectedLocation, distributor.location);
    return `${distance.toFixed(1)} km away`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search distributors by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Distance (km)
                </label>
                <input
                  type="number"
                  value={filters.maxDistance}
                  onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Water Type
                </label>
                <select
                  value={filters.waterType}
                  onChange={(e) => handleFilterChange('waterType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Type</option>
                  <option value="spring">Spring Water</option>
                  <option value="purified">Purified Water</option>
                  <option value="mineral">Mineral Water</option>
                  <option value="filtered">Filtered Water</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Mode
                </label>
                <select
                  value={filters.transportMode}
                  onChange={(e) => handleFilterChange('transportMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Mode</option>
                  <option value="truck">Truck</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="handcart">Hand Cart</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
              <span className="text-sm text-gray-600">
                {filteredDistributors.length} distributors found
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Distributors List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading distributors...</p>
          </div>
        ) : filteredDistributors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No distributors found matching your criteria</p>
          </div>
        ) : (
          filteredDistributors.map((distributor) => (
            <div
              key={distributor._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onDistributorSelect(distributor)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{distributor.name}</h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-700">
                        {distributor.rating?.toFixed(1) || 'N/A'}
                      </span>
                      <span className="ml-1 text-sm text-gray-500">
                        ({distributor.reviewCount || 0} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{distributor.address}</span>
                    {getDistanceText(distributor) && (
                      <span className="ml-2 text-sm text-blue-600">
                        • {getDistanceText(distributor)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center text-gray-600 mb-3">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">{distributor.workingHours}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Water Supply:</span>
                      <p className="font-medium text-gray-900">{distributor.waterSupply}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Transport:</span>
                      <p className="font-medium text-gray-900 capitalize">{distributor.transportMode}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Pricing:</span>
                      <p className="font-medium text-gray-900">{distributor.pricing}</p>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DistributorSearch;
