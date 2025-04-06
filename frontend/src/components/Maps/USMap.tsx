import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { FIRMSData, fetchRecentFIRMSData } from '../../services/firmsService';
import LoadingSpinner from '../utils/Loading/LoadingSpinner';

// Define props interface for the Map component
interface MapProps {
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    severity: number;
    details?: string;
  }>;
  fullscreen?: boolean;
}

const USMap = ({ 
  center = [37.8, -96], // Default center of USA
  zoom = 4,
  markers = [],
  fullscreen = false
}: MapProps) => {
  // Create a reference to store the map instance
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const [firmsData, setFirmsData] = useState<FIRMSData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define continental US bounds
  const usBounds = L.latLngBounds(
    [24.0, -125.0], // Southwest corner
    [49.5, -66.0]   // Northeast corner
  );

  // Fetch FIRMS data only once when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch fire data
        const data = await fetchRecentFIRMSData();
        setFirmsData(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch FIRMS data:", error);
        setError("Failed to fetch wildfire data.");
      }
    };

    fetchData();
  }, []); // Empty dependency array - fetch only once

  // Update the container size when fullscreen changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    // After the container resizes due to fullscreen change,
    // invalidate the map size so Leaflet recalculates dimensions
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
    
  }, [fullscreen]); // React only to fullscreen changes

  // Separate function to apply heatmap
  const applyHeatmap = () => {
    if (!mapRef.current || !firmsData || firmsData.length === 0) return;
  
    // Remove existing heatmap if it exists
    if (heatLayerRef.current && mapRef.current.hasLayer(heatLayerRef.current)) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
  
    try {
      // Make sure firmsData is an array before attempting to map it
      let firePoints: FIRMSData[] = [];
      
      if (Array.isArray(firmsData)) {
        firePoints = firmsData;
      } else if (typeof firmsData === 'object' && firmsData !== null) {
        // Handle different API response formats
        const dataObj = firmsData as { data?: FIRMSData[], results?: FIRMSData[] };
        if ('data' in dataObj && Array.isArray(dataObj.data)) {
          firePoints = dataObj.data;
        } else if ('results' in dataObj && Array.isArray(dataObj.results)) {
          firePoints = (firmsData as { results: FIRMSData[] }).results;
        } else {
          // Last resort: try to convert object to array if it contains location data
          const keys = Object.keys(firmsData);
          if (keys.length > 0 && 
              typeof firmsData[keys[0]] === 'object' && 
              'latitude' in firmsData[keys[0]] && 
              'longitude' in firmsData[keys[0]]) {
            firePoints = keys.map(key => firmsData[key]);
          }
        }
      }
  
      if (firePoints.length === 0) {
        console.error("Could not extract valid fire data points from API response");
        return;
      }
  
      // Filter out any invalid data points and limit to continental US
      const validPoints = firePoints.filter(point => 
        typeof point.latitude === 'number' && 
        typeof point.longitude === 'number' && 
        typeof point.frp === 'number' &&
        point.latitude > 24.0 && // Southern border of continental US
        point.latitude < 49.5 && // Northern border of continental US
        point.longitude > -125.0 && // Western border of continental US
        point.longitude < -66.0 // Eastern border of continental US
      );
  
      // Convert FIRMS data to heatmap format [lat, lng, intensity]
      const heatData = validPoints.map(point => {
        // Use frp (Fire Radiative Power) as intensity, with a minimum value
        const intensity = Math.max(point.frp / 10, 0.5); // Ensure minimum visibility
        return [point.latitude, point.longitude, intensity];
      });
  
      if (heatData.length === 0) {
        console.warn("No valid heat points to display");
        return;
      }
  
      console.log(`Creating heatmap with ${heatData.length} fire points`);
      
      // Create and add the heatmap layer
      heatLayerRef.current = L.heatLayer(heatData as [number, number, number][], {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 10,
        gradient: {
          0.1: '#89CFF0', // Light blue
          0.3: '#00FF00', // Green
          0.5: '#FFFF00', // Yellow
          0.7: '#FFA500', // Orange
          0.9: '#FF0000'  // Red
        }
      }).addTo(mapRef.current);
    } catch (error) {
      console.error("Error creating heatmap:", error);
      setError("Error creating heatmap visualization");
    }
  };
  
  // Effect to apply heatmap when FIRMS data changes
  useEffect(() => {
    if (firmsData.length === 0) return;
    
    // Create the map instance if it hasn't been created yet
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center,
        zoom,
        maxBounds: usBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 4
      }).setView(center, zoom);
  
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapRef.current);
    }
    
    // Apply the heatmap based on the fetched firm's data
    applyHeatmap();
    setLoading(false);
  }, [firmsData]);

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
      const severity = marker.severity;
      const color = severity > 7 ? '#FF3B30' : severity > 4 ? '#FF9500' : '#FFCC00';
      const radius = Math.max(8, severity * 3); // Minimum size with scaling
      
      const circleMarker = L.circleMarker(marker.position, {
        radius,
        fillColor: color,
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
        className: 'pulse-marker' // We'll add animation
      }).addTo(mapRef.current!);
      
      // Enhanced popup
      if (marker.details) {
        circleMarker.bindPopup(
          `<div class="popup-content">
            <h3 class="text-lg font-bold mb-2">Wildfire Alert</h3>
            <p>${marker.details}</p>
            <p class="mt-2"><strong>Severity:</strong> ${marker.severity}/10</p>
          </div>`,
          {
            closeButton: true,
            className: 'custom-popup'
          }
        );
      }
    });
  }, [markers]);


  return (
    <div className="relative">
      {loading && (
      <div className="loading-overlay absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-10 text-white">
        <div className="p-4 bg-gray-800 rounded-lg">
          <LoadingSpinner />
        </div>
      </div>
      )}
      {error && (
        <div className="error-message absolute top-2 left-2 right-2 z-10 bg-red-600 text-white p-3 rounded-md shadow-lg">
          {error}
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        style={{ 
          height: fullscreen ? 'calc(100vh - 48px)' : '600px',
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }} 
        className="map-container" 
      />
    </div>
  );
};

export default USMap;