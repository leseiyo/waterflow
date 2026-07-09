import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <h1 className="text-4xl font-bold text-blue-600">WaterFlow - Coming Soon</h1>
      <SpeedInsights />
    </div>
  );
}

export default App;