import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link to="/" className="flex items-center">
            <div className="flex items-center text-2xl font-extrabold">
              <span className="text-black">VOI</span>
              <span className="text-white bg-black ml-1 px-1 rounded">SE</span>
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">WaterFlow</span>
          </Link>
        </div>
      </div>
    </header>
  );
}