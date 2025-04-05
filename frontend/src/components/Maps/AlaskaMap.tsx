import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define props interface for the Map component
interface MapProps {
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    severity: number;
    details?: string;
  }>;
}

const hawaiiMap = ({ 
  center = [39.8, -98.5], // Center of the contiguous US
  zoom = 4,
  markers = [] 
}: MapProps) => {
  // Create a reference to store the map instance
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize map only once when component mounts
    if (!mapContainerRef.current || mapRef.current) return;

    // Define US bounds including Alaska and Hawaii
    const usBounds = L.latLngBounds(
      [18.0, -180.0], // Southwest corner (includes Hawaii and Alaska)
      [72.0, -50.0]   // Northeast corner (includes all of continental US)
    );

    // Create Leaflet map instance with bounds restrictions
    mapRef.current = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      maxBounds: usBounds, // Restrict panning to these bounds
      maxBoundsViscosity: 1.0, // Makes the bounds "solid" - can't pan outside them
      minZoom: 3 // Prevent zooming out too far
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 13, // Limit max zoom to avoid too detailed view
      noWrap: true, // Prevents the world from repeating
      bounds: usBounds
    }).addTo(mapRef.current);

    // Initially fit the map to US bounds
    mapRef.current.fitBounds(usBounds);

    // Cleanup function to remove map when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Effect to add/update markers when markers prop changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add new markers
    markers.forEach(marker => {
      // Create custom icon based on severity
      const severity = marker.severity;
      const color = severity > 7 ? 'red' : severity > 4 ? 'orange' : 'yellow';
      const radius = severity * 4; // Size based on severity
      
      const circleMarker = L.circleMarker(marker.position, {
        radius,
        fillColor: color,
        color: 'white',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(mapRef.current!);
      
      // Add popup if details are provided
      if (marker.details) {
        // Generate fire icons based on severity (JavaScript way)
        const fireIcons = '🔥'.repeat(Math.ceil(marker.severity));
        
        // Create a div with flexbox column layout
        const popupContent = `
          <div style="display: flex; flex-direction: column; ">
            <div style="font-size: 24px; margin-bottom: 10px;">
              ${fireIcons}
            </div>
            <div>
              ${marker.details}
            </div>
          </div>
        `;
        
        // Bind the formatted popup content
        circleMarker.bindPopup(popupContent);
      }
    });
  }, [markers]);

  // Set the view when center or zoom changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }} 
    />
  );
};

export default hawaiiMap;