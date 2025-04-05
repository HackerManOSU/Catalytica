import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { FIRMSData, fetchRecentFIRMSData } from '../../services/firmsService';

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
  center = [37.8, -96], // Default center of USA
  zoom = 4.5,
  markers = [] 
}: MapProps) => {
  // Create a reference to store the map instance
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const [firmsData, setFirmsData] = useState<FIRMSData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch FIRMS data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch 3 days of fire data
        const data = await fetchRecentFIRMSData(1000);
        setFirmsData(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch FIRMS data:", error);
        setError("Failed to fetch wildfire data. Using fallback data.");
        
        // Fallback to mock data if API fails
        const mockData: FIRMSData[] = [
          // California wildfires
          { latitude: 37.7749, longitude: -122.4194, brightness: 340.5, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 95, bright_t31: 290.5, frp: 45.2 },
          { latitude: 34.0522, longitude: -118.2437, brightness: 320.8, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 90, bright_t31: 285.6, frp: 36.7 },
          { latitude: 36.7783, longitude: -119.4179, brightness: 355.2, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 98, bright_t31: 298.1, frp: 52.3 },
          
          // Oregon wildfires
          { latitude: 45.5152, longitude: -122.6784, brightness: 330.1, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 88, bright_t31: 280.9, frp: 30.5 },
          { latitude: 44.0582, longitude: -121.3153, brightness: 335.4, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 92, bright_t31: 282.7, frp: 33.8 },
          
          // Colorado wildfires
          { latitude: 39.7392, longitude: -104.9903, brightness: 315.6, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 85, bright_t31: 275.2, frp: 28.9 },
          { latitude: 38.8339, longitude: -104.8214, brightness: 325.7, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 87, bright_t31: 278.4, frp: 31.2 },
          
          // Texas wildfires
          { latitude: 31.9686, longitude: -99.9018, brightness: 338.3, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 93, bright_t31: 286.8, frp: 35.1 },
          { latitude: 32.7767, longitude: -96.7970, brightness: 318.9, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 86, bright_t31: 277.3, frp: 29.4 }
        ];
        
        setFirmsData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Initialize map only once when component mounts
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Leaflet map instance without US boundaries
    mapRef.current = L.map(mapContainerRef.current, {
      center,
      zoom,
      minZoom: 2 // Prevent extreme zoom out
    }).setView(center, zoom);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapRef.current);

    // Cleanup function to remove map when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom]);

  // Effect to add/update heatmap when FIRMS data changes
  useEffect(() => {
    if (!mapRef.current || !firmsData || firmsData.length === 0) return;
  
    // Remove existing heatmap if it exists
    if (heatLayerRef.current) {
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
  
      // Filter out any invalid data points
      const validPoints = firePoints.filter(point => 
        typeof point.latitude === 'number' && 
        typeof point.longitude === 'number' && 
        typeof point.frp === 'number'
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

  useEffect(() => {
    // Add custom CSS to the head
    const style = document.createElement('style');
    style.textContent = `
      .pulse-marker {
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% {
          opacity: 0.7;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.3);
        }
        100% {
          opacity: 0.7;
          transform: scale(1);
        }
      }
      
      .custom-popup .leaflet-popup-content-wrapper {
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 8px;
        padding: 5px;
      }
      
      .custom-popup .leaflet-popup-tip {
        background-color: rgba(0, 0, 0, 0.8);
      }
      
      .map-container {
        border: 2px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .map-container:hover {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        margin: '0 auto' // This centers the div horizontally
      }} 
    />
  );
};

export default hawaiiMap;