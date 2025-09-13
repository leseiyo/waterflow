import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const RatingForm = ({ isOpen, onClose, order, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const ratingTags = [
    { id: 'quality', label: 'Water Quality', icon: '💧' },
    { id: 'delivery', label: 'Delivery Speed', icon: '🚚' },
    { id: 'service', label: 'Customer Service', icon: '😊' },
    { id: 'pricing', label: 'Fair Pricing', icon: '💰' },
    { id: 'cleanliness', label: 'Clean Delivery', icon: '✨' }
  ];

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      const ratingData = {
        orderId: order._id,
        distributorId: order.distributor._id,
        rating: rating,
        review: review,
        tags: selectedTags
      };

      const response = await axios.post('/api/ratings', ratingData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });

      toast.success('Thank you for your feedback!');
      onClose();
      
      if (onRatingSubmitted) {
        onRatingSubmitted(response.data);
      }

      // Reset form
      setRating(0);
      setReview('');
      setSelectedTags([]);

    } catch (error) {
      toast.error('Failed to submit rating');
      console.error('Rating submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Experience</h2>
            <p className="text-gray-600">
              How was your water delivery from <span className="font-medium">{order.distributor?.name}</span>?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Stars */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {rating === 0 && 'Click a star to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Rating Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What was good about this delivery?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ratingTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`flex items-center p-2 rounded-lg border text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{tag.icon}</span>
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Write a Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your experience with other customers..."
              />
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Order #{order._id?.slice(-6)}</p>
                <p>{order.quantity} {order.unit} delivered on {new Date(order.deliveryDate).toLocaleDateString()}</p>
                <p>Total: ${order.totalAmount}</p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Submit Rating
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

export default RatingForm;
