import React, { Suspense, lazy } from 'react';

export default function LazyWrapper({ component: Component, fallback = null, ...props }) {
  if (!Component) return null;
  return (
    <Suspense fallback={fallback || <div className="p-4">Loading...</div>}>
      <Component {...props} />
    </Suspense>
  );
}

// Named helpers for common lazy components (used by pages)
export const LazyDistributorLocationMap = (props) => {
  const Component = lazy(() => import('./DistributorLocationMap'));
  return <LazyWrapper component={Component} {...props} />;
};

export const LazyAvailabilityManager = (props) => {
  const Component = lazy(() => import('./AvailabilityManager'));
  return <LazyWrapper component={Component} {...props} />;
};
