import React, { useEffect, useState } from 'react';

const PerformanceMonitor = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    componentRenderTime: 0,
    apiResponseTime: 0
  });

  useEffect(() => {
    if (!enabled) return;

    // Monitor page load time
    const pageLoadStart = performance.now();
    
    const handleLoad = () => {
      const pageLoadTime = performance.now() - pageLoadStart;
      setMetrics(prev => ({ ...prev, pageLoadTime }));
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Monitor component render time
    const renderStart = performance.now();
    const renderTime = performance.now() - renderStart;
    setMetrics(prev => ({ ...prev, componentRenderTime: renderTime }));

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [enabled]);

  const logApiTime = (startTime, endpoint) => {
    if (!enabled) return;
    
    const responseTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, apiResponseTime: responseTime }));
    
    console.log(`API ${endpoint} took ${responseTime.toFixed(2)}ms`);
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>Page Load: {metrics.pageLoadTime.toFixed(0)}ms</div>
      <div>Render: {metrics.componentRenderTime.toFixed(2)}ms</div>
      <div>API: {metrics.apiResponseTime.toFixed(0)}ms</div>
    </div>
  );
};

export default PerformanceMonitor;
