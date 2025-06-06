import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { FIRMSData, fetchRecentFIRMSData } from '../../services/firmsService';
import LoadingSpinner from '../utils/Loading/LoadingSpinner';
import { useMapDispatch, useMapState } from '../utils/mapstate'; // Import the map dispatch
import { MapActions } from '../utils/mapstate'; // Import map actions

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

const AlaskaMap = ({ 
  center = [64.2008, -149.4937], // Center of Alaska
  zoom = 4,
  markers = [],
  fullscreen = false
}: MapProps) => {
  // Create a reference to store the map instance
  const mapDispatch = useMapDispatch();
  const MapState = useMapState();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const [firmsData, setFirmsData] = useState<FIRMSData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);


  // Fetch FIRMS data without clearing loading state here
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch fire data - use the same parameter as USMap
        const data = await fetchRecentFIRMSData();
        setFirmsData(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch FIRMS data:", error);
        setError("Failed to fetch wildfire data.");
      }
    };

    fetchData();
  }, []);

    // Fetch FIRMS data
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const data = await fetchRecentFIRMSData();
          setFirmsData(data);
          setError(null);
        } catch (error) {
          console.error("Failed to fetch FIRMS data:", error);
          setError("Failed to fetch wildfire data.");
        }
      };
  
      fetchData();
    }, []);
  
    // Map initialization effect
    useEffect(() => {
      if (!mapContainerRef.current) return;
  
      const alaskaBounds = L.latLngBounds(
        [51.0, -180.0],
        [71.5, -129.0]
      );
  
      mapRef.current = L.map(mapContainerRef.current, {
        center,
        zoom,
        maxBounds: alaskaBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 3
      }).setView(center, zoom);
  
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        mapDispatch(MapActions.setCurrentLatitude(lat));
        mapDispatch(MapActions.setCurrentLongitude(lng));
        console.log(`Clicked coordinates: ${lat}, ${lng}`);
        console.log(MapState.currentLatitude, MapState.currentLongitude);
        L.marker([lat, lng]).addTo(mapRef.current!);
      });
  
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        bounds: alaskaBounds
      }).addTo(mapRef.current);
  
      mapRef.current.fitBounds(alaskaBounds);
  
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }, []); // Empty dependency array for one-time initialization
  

    useEffect(() => {
      if (!mapRef.current || !firmsData || firmsData.length === 0) return;
  
      if (heatLayerRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
  
      try {
        let firePoints: FIRMSData[] = [];
        
        if (Array.isArray(firmsData)) {
          firePoints = firmsData;
        } else if (typeof firmsData === 'object' && firmsData !== null) {
          const dataObj = firmsData as { data?: FIRMSData[], results?: FIRMSData[] };
          if ('data' in dataObj && Array.isArray(dataObj.data)) {
            firePoints = dataObj.data;
          } else if ('results' in dataObj && Array.isArray(dataObj.results)) {
            firePoints = (firmsData as { results: FIRMSData[] }).results;
          } else {
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
  
        const alaskaPoints = firePoints.filter(point => 
          typeof point.latitude === 'number' && 
          typeof point.longitude === 'number' && 
          typeof point.frp === 'number' &&
          point.latitude > 51.0 && 
          point.latitude < 71.5 &&
          point.longitude < -129.0 && 
          point.longitude > -180.0
        );
  
        const heatData = alaskaPoints.map(point => {
          const intensity = Math.max(point.frp / 10, 0.5);
          return [point.latitude, point.longitude, intensity];
        });
  
        console.log(`Creating Alaska heatmap with ${heatData.length} fire points`);
        
        heatLayerRef.current = L.heatLayer(heatData as [number, number, number][], {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          max: 10,
          gradient: {
            0.1: '#89CFF0',
            0.3: '#00FF00',
            0.5: '#FFFF00',
            0.7: '#FFA500',
            0.9: '#FF0000'
          }
        }).addTo(mapRef.current);
        
        setLoading(false);      
        setMapReady(true);

      } catch (error) {
        console.error("Error creating heatmap:", error);
        setError("Error creating heatmap visualization");
      }
    }, [firmsData]); // Only depend on firmsData

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
        className: 'pulse-marker'
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
      <div className="loading-overlay absolute bg-gray-800 rounded-xl top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-10 text-white">
        <LoadingSpinner />
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
          height: fullscreen ? 'calc(100vh - 48px)' : '280px',
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 1)',
          overflow: 'hidden',
          visibility: mapReady ? 'visible' : 'hidden'
        }} 
        className="map-container" 
      />
    </div>
  );
};

export default AlaskaMap;