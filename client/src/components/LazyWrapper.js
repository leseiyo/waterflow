import React, { Suspense, lazy } from 'react';

// Lazy load components
const DistributorLocationMap = lazy(() => import('./DistributorLocationMap'));
const AvailabilityManager = lazy(() => import('./AvailabilityManager'));

export default function LazyWrapper({ component: Component, fallback = null, ...props }) {
  if (!Component) return null;
  return (
    <Suspense fallback={fallback || <div className="p-4">Loading...</div>}>
      <Component {...props} />
    </Suspense>
  );
}

// Named exports for lazy components
export const LazyDistributorLocationMap = (props) => (
  <LazyWrapper component={DistributorLocationMap} {...props} />
);

export const LazyAvailabilityManager = (props) => (
  <LazyWrapper component={AvailabilityManager} {...props} />
);
