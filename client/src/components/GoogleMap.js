import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

const MapComponent = ({ center, zoom, markers, onMapClick, className = "w-full h-64" }) => {
  const ref = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });
      setMap(newMap);
    }
  }, [ref, map, center, zoom]);

  useEffect(() => {
    if (map && markers) {
      // Clear existing markers
      markers.forEach(marker => {
        if (marker.marker) {
          marker.marker.setMap(null);
        }
      });

      // Add new markers
      markers.forEach((markerData, index) => {
        const marker = new window.google.maps.Marker({
          position: markerData.position,
          map,
          title: markerData.title,
          icon: markerData.icon || null,
          animation: markerData.animation || null,
        });

        // Store marker reference
        markerData.marker = marker;

        // Add info window if content provided
        if (markerData.infoWindow) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: markerData.infoWindow,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
      });
    }
  }, [map, markers]);

  useEffect(() => {
    if (map && onMapClick) {
      const listener = map.addListener('click', (event) => {
        onMapClick(event.latLng);
      });

      return () => {
        window.google.maps.event.removeListener(listener);
      };
    }
  }, [map, onMapClick]);

  return <div ref={ref} className={className} />;
};

const render = (status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load map</p>
            <p className="text-sm text-red-500">Please check your Google Maps API key</p>
          </div>
        </div>
      );
    default:
      return null;
  }
};

const GoogleMap = ({ 
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 13,
  markers = [],
  onMapClick,
  className,
  apiKey
}) => {
  const [mapCenter, setMapCenter] = useState(center);

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  return (
    <Wrapper apiKey={apiKey} render={render}>
      <MapComponent
        center={mapCenter}
        zoom={zoom}
        markers={markers}
        onMapClick={onMapClick}
        className={className}
      />
    </Wrapper>
  );
};

export default GoogleMap;
