import React, { Suspense, lazy } from 'react';
import LoadingSkeleton from './LoadingSkeleton';

const LazyWrapper = ({ 
  component: Component, 
  fallback, 
  fallbackType = 'card',
  fallbackCount = 1,
  ...props 
}) => {
  const FallbackComponent = fallback || (
    <LoadingSkeleton type={fallbackType} count={fallbackCount} />
  );

  return (
    <Suspense fallback={FallbackComponent}>
      <Component {...props} />
    </Suspense>
  );
};

// Lazy load heavy components
export const LazyOrderTrackingMap = lazy(() => import('./OrderTrackingMap'));
export const LazyDistributorLocationMap = lazy(() => import('./DistributorLocationMap'));
export const LazyOrderForm = lazy(() => import('./OrderForm'));
export const LazyDistributorSearch = lazy(() => import('./DistributorSearch'));
export const LazyRatingForm = lazy(() => import('./RatingForm'));
export const LazyAvailabilityManager = lazy(() => import('./AvailabilityManager'));

export default LazyWrapper;
