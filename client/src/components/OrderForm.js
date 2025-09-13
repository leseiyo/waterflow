import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, MapPin, Clock, DollarSign, Truck, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const OrderForm = ({ isOpen, onClose, selectedDistributor }) => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    quantity: '',
    unit: 'liters',
    deliveryAddress: user?.address || '',
    deliveryDate: '',
    deliveryTime: '',
    specialInstructions: '',
    paymentMethod: 'cash'
  });
  const [loading, setLoading] = useState(false);
  const [distributors, setDistributors] = useState([]);
  const [selectedDist, setSelectedDist] = useState(selectedDistributor || null);

  useEffect(() => {
    if (isOpen) {
      fetchDistributors();
      // Set default delivery date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        deliveryDate: tomorrow.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const fetchDistributors = async () => {
    try {
      const response = await axios.get('/api/distributors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDistributors(response.data);
    } catch (error) {
      console.error('Failed to fetch distributors:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    if (!selectedDist || !formData.quantity) return 0;
    const pricePerUnit = parseFloat(selectedDist.pricing?.replace(/[^0-9.]/g, '')) || 2;
    return (parseFloat(formData.quantity) * pricePerUnit).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDist) {
      toast.error('Please select a distributor');
      return;
    }

    if (!formData.quantity || !formData.deliveryAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        distributorId: selectedDist._id,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        deliveryAddress: formData.deliveryAddress,
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        specialInstructions: formData.specialInstructions,
        paymentMethod: formData.paymentMethod,
        totalAmount: calculateTotal()
      };

      const response = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order placed successfully!');
      onClose();
      
      // Reset form
      setFormData({
        quantity: '',
        unit: 'liters',
        deliveryAddress: user?.address || '',
        deliveryDate: '',
        deliveryTime: '',
        specialInstructions: '',
        paymentMethod: 'cash'
      });
      setSelectedDist(null);

    } catch (error) {
      toast.error('Failed to place order');
      console.error('Order creation error:', error);
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
            <h2 className="text-2xl font-bold text-gray-900">Place New Order</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Distributor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Distributor
              </label>
              <div className="grid gap-3">
                {distributors.map((distributor) => (
                  <div
                    key={distributor._id}
                    onClick={() => setSelectedDist(distributor)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDist?._id === distributor._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{distributor.name}</h3>
                        <p className="text-sm text-gray-600">{distributor.address}</p>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-600">
                            {distributor.rating?.toFixed(1) || 'N/A'} ({distributor.reviewCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{distributor.pricing}</p>
                        <p className="text-sm text-gray-600">{distributor.waterSupply}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex">
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    step="0.1"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter quantity"
                  />
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="liters">Liters</option>
                    <option value="gallons">Gallons</option>
                    <option value="bottles">Bottles</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash on Delivery</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="mobile">Mobile Payment</option>
                </select>
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address
              </label>
              <textarea
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter delivery address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <select
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning (8 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                  <option value="evening">Evening (4 PM - 8 PM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special delivery instructions..."
              />
            </div>

            {/* Order Summary */}
            {selectedDist && formData.quantity && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distributor:</span>
                    <span className="font-medium">{selectedDist.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{formData.quantity} {formData.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per {formData.unit}:</span>
                    <span className="font-medium">{selectedDist.pricing}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
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
                disabled={loading || !selectedDist}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Place Order
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

export default OrderForm;
