import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const VenueMap = () => {
  // Abuja Coordinates (Example: International Conference Centre)
  const center = {
    lat: 9.0579,
    lng: 7.4951
  };

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  const options = {
    disableDefaultUI: false,
    zoomControl: true,
    styles: [
      {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#242f3e" }]
      },
      {
        featureType: "all",
        elementType: "labels.text.stroke",
        stylers: [{ lightness: -80 }]
      },
      {
        featureType: "administrative",
        elementType: "labels.text.fill",
        stylers: [{ color: "#746855" }]
      },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }]
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }]
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }]
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ lightness: -20 }]
      }
    ]
  };

  const [selectedCenter, setSelectedCenter] = useState(null);

  return (
    <div className="w-full h-[500px] border border-deep-black relative z-0">
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          options={options}
        >
          <Marker
            position={center}
            onClick={() => setSelectedCenter(center)}
          />

          {selectedCenter && (
            <InfoWindow
              position={center}
              onCloseClick={() => setSelectedCenter(null)}
            >
              <div className="text-center p-2">
                <h3 className="font-heading font-bold uppercase text-deep-black">Wodibenuah Fair 2026</h3>
                <p className="font-body text-xs text-gray-600">Main Exhibition Hall</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      
      {/* Overlay Card */}
      <div className="absolute top-4 left-4 z-[100] bg-white p-6 border border-deep-black shadow-lg max-w-xs hidden md:block">
        <h3 className="text-xl font-heading font-bold uppercase mb-2">The Venue</h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Join us at the heart of Abuja for an unforgettable experience. 
          Accessible parking and VIP entrance available.
        </p>
        <div className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>Abuja, Nigeria</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>June 15 - 16, 2026</span>
          </div>
        </div>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 block text-center bg-deep-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-deep-black transition-colors"
        >
          Get Directions
        </a>
      </div>
    </div>
  );
};

export default VenueMap;
