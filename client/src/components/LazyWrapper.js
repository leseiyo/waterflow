import React, { Suspense } from 'react';

export default function LazyWrapper({ component: Component, fallback = null, ...props }) {
  if (!Component) return null;
  return (
    <Suspense fallback={fallback || <div className="p-4">Loading...</div>}>
      <Component {...props} />
    </Suspense>
  );
}
