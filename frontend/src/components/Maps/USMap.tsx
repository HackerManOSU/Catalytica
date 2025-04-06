import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { FIRMSData, fetchRecentFIRMSData } from '../../services/firmsService';
import LoadingSpinner from '../utils/Loading/LoadingSpinner';
import { useMapDispatch, useMapState } from '../utils/mapstate'; 
import { MapActions } from '../utils/mapstate'; 
import './border.css';

interface MapProps {
  center?: [number, number]; 
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    severity: number;
    details?: string;
  }>;
  fullscreen?: boolean;
}

const USMap = ({ 
  zoom = 4,
  markers = [],
  fullscreen = false
}: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const [firmsData, setFirmsData] = useState<FIRMSData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mapDispatch = useMapDispatch();
  const MapState = useMapState();
  const [mapReady, setMapReady] = useState<boolean>(false);

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
  }, []); 

  useEffect(() => {
    if (!mapRef.current) return;
    

    setTimeout(() => {
      mapRef.current?.invalidateSize();
      
      const usBounds = L.latLngBounds(
        [24.0, -125.0], 
        [49.5, -66.0]   
      );
      
      mapRef.current?.fitBounds(usBounds, {
        padding: [20, 20], 
        animate: true
      });
    }, 100);
    
  }, [fullscreen]);
    
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const usBounds = L.latLngBounds(
      [24.0, -125.0], 
      [49.5, -66.0]   
    );

    mapRef.current = L.map(mapContainerRef.current, {
      maxBounds: usBounds.pad(0.1), 
      maxBoundsViscosity: 1.0, 
      minZoom: 4, 
      zoomSnap: 0.5, 
    });

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
      maxZoom: 19
    }).addTo(mapRef.current);

    mapRef.current.fitBounds(usBounds, {
      padding: [20, 20], 
      animate: false 
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); 


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

      const usPoints = firePoints.filter(point => 
        typeof point.latitude === 'number' && 
        typeof point.longitude === 'number' && 
        typeof point.frp === 'number' &&
        point.latitude > 24.0 && // Southern border of continental US
        point.latitude < 49.5 && // Northern border of continental US
        point.longitude > -125.0 && // Western border of continental US
        point.longitude < -66.0 // Eastern border of continental US
      );

      const heatData = usPoints.map(point => {
        const intensity = Math.max(point.frp / 10, 0.5);
        return [point.latitude, point.longitude, intensity];
      });

      console.log(`Creating US heatmap with ${heatData.length} fire points`);
      
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
      
      setTimeout(() => {
        setLoading(false);
        setMapReady(true);
      }, 2000);

    } catch (error) {
      console.error("Error creating heatmap:", error);
      setError("Error creating heatmap visualization");
      setLoading(false);
    }
  }, [firmsData]); 



  useEffect(() => {
    if (!mapRef.current) return;
    
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    markers.forEach(marker => {
      const severity = marker.severity;
      const color = severity > 7 ? '#FF3B30' : severity > 4 ? '#FF9500' : '#FFCC00';
      const radius = Math.max(8, severity * 3); 
      
      const circleMarker = L.circleMarker(marker.position, {
        radius,
        fillColor: color,
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
        className: 'pulse-marker' 
      }).addTo(mapRef.current!);
      
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
      <div className="box loading-overlay absolute bg-gray-800 rounded-xl top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-10 text-white">
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
          height: fullscreen ? 'calc(100vh - 48px)' : '600px',
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)',
          border: '3px solid rgb(251, 146, 60)',
          overflow: 'hidden',
          visibility: mapReady ? 'visible' : 'hidden' 
        }} 
        className="map-container border-radar" 
      />
    </div>
  );
};

export default USMap;