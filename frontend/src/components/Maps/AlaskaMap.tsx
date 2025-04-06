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

const AlaskaMap = ({ 
  center = [64.2008, -149.4937], 
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

  // Function to handle coordinates update
  const handleCoordinateUpdate = (lat: number, lng: number) => {
    mapDispatch(MapActions.setCurrentLatitude(lat));
    mapDispatch(MapActions.setCurrentLongitude(lng));
    console.log(`Clicked coordinates: ${lat}, ${lng}`);
    console.log(MapState.currentLatitude, MapState.currentLongitude);
    L.marker([lat, lng]).addTo(mapRef.current!);
  };

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
      maxBounds: alaskaBounds.pad(0.1),
      maxBoundsViscosity: 1.0,
      minZoom: 3,
      zoomSnap: 0.5,
    });

    mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      handleCoordinateUpdate(lat, lng);
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapRef.current);

    mapRef.current.fitBounds(alaskaBounds, {
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

  // Handle map resize when fullscreen changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    setTimeout(() => {
      mapRef.current?.invalidateSize();
      const alaskaBounds = L.latLngBounds(
        [51.0, -180.0],
        [71.5, -129.0]
      );
      mapRef.current?.fitBounds(alaskaBounds, {
        padding: [20, 20],
        animate: true
      });
    }, 100);
    
  }, [fullscreen]);

  useEffect(() => {
    if (!mapRef.current || !firmsData || firmsData.length === 0) return;
  
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
  
    // Clear any existing fire markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        mapRef.current?.removeLayer(layer);
      }
    });
  
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
  
      // Filter points within Alaska boundaries
      const alaskaPoints = firePoints.filter(point => 
        typeof point.latitude === 'number' && 
        typeof point.longitude === 'number' && 
        typeof point.frp === 'number' &&
        point.latitude > 51.0 && 
        point.latitude < 71.5 &&
        point.longitude < -129.0 && 
        point.longitude > -180.0
      );
  
      // Define FRP thresholds (same as USMap)
      const FRP_LOW = 100;      // Normal fires
      const FRP_MEDIUM = 400;   // Medium fires
      const FRP_HIGH = 800;    // High fires
      const FRP_EXTREME = 1500; // Extreme fires
  
      // Separate fires by FRP categories
      const lowFRPPoints = alaskaPoints.filter(point => point.frp < FRP_LOW);
      const mediumFRPPoints = alaskaPoints.filter(point => point.frp >= FRP_LOW && point.frp < FRP_HIGH);
      const highFRPPoints = alaskaPoints.filter(point => point.frp >= FRP_HIGH && point.frp < FRP_EXTREME);
      const extremeFRPPoints = alaskaPoints.filter(point => point.frp >= FRP_EXTREME);
  
      // Map low FRP fires for the heat layer
      const heatData = lowFRPPoints.map(point => {
        const frp = point.frp || 0;
        const intensity = Math.max(0.5, Math.min(5, frp / 100)); // Lower max intensity for small fires
        return [point.latitude, point.longitude, intensity];
      });
  
      console.log(`Creating Alaska heatmap with ${heatData.length} low FRP fire points`);
      
      // Create heat layer for low FRP fires
      heatLayerRef.current = L.heatLayer(heatData as [number, number, number][], {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 10,
        gradient: {
          0.1: '#87CEFA',
          0.3: '#98FB98',
          0.5: '#FFFF00',
          0.6: '#FFA500',
          0.7: '#FF4500',
          0.8: '#FF0000',
          0.9: '#8B0000'
        }
      }).addTo(mapRef.current);
      
      // Add medium FRP fires as orange markers
      mediumFRPPoints.forEach(point => {
        const baseRadius = 10 + (point.frp / 100);
        const circleMarker = L.circleMarker([point.latitude, point.longitude], {
          radius: baseRadius,
          fillColor: '#FFA500', // Orange
          color: '#FFA500',
          weight: 1,
          fillOpacity: 0.7,
          interactive: true
        }).bindPopup(`<strong>Fire</strong><br>FRP: ${point.frp.toFixed(1)} MW`)
          .addTo(mapRef.current!);
          
        // Add click handler for medium FRP markers
        circleMarker.on('click', function(e) {
          // Stop propagation to prevent the map's click event from firing
          L.DomEvent.stopPropagation(e);
          
          const { lat, lng } = e.target.getLatLng();
          handleCoordinateUpdate(lat, lng);
        });
      });
      
      // Add high FRP fires as bright red markers with radius based on FRP
      highFRPPoints.forEach(point => {
        // Calculate radius based on FRP value
        const baseRadius = 20 + (point.frp / 100); 
        
        // Create the main bright red marker
        const mainMarker = L.circleMarker([point.latitude, point.longitude], {
          radius: baseRadius,
          fillColor: '#FF0000', // Bright Red
          color: '#FF0000',
          weight: 1,
          fillOpacity: 0.8,
          interactive: true
        }).bindPopup(`<strong>Major Fire</strong><br>FRP: ${point.frp.toFixed(1)} MW`)
          .addTo(mapRef.current!);
          
        // Add click handler for high FRP markers
        mainMarker.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          const { lat, lng } = e.target.getLatLng();
          handleCoordinateUpdate(lat, lng);
        });
          
        // Add a pulsing effect with a second marker
        L.circleMarker([point.latitude, point.longitude], {
          radius: baseRadius * 1.5,
          fillColor: '#FF0000',
          color: '#FF0000',
          weight: 0.5,
          fillOpacity: 0.3,
          className: 'pulse-marker',
          interactive: false
        }).addTo(mapRef.current!);
      });
      
      // For extreme FRP fires, add multiple concentric markers to increase visibility at any zoom level
      extremeFRPPoints.forEach(point => {
        // Base radius calculation with higher factor for extreme fires
        const baseRadius = 30 + (point.frp / 500);
        
        // Track the main interactive circle
        let mainCircle: L.CircleMarker | null = null;
        
        // Add multiple concentric circles with decreasing opacity
        for (let i = 0; i < 4; i++) {
          const radiusMultiplier = 1 + (i * 0.5); // 1, 1.5, 2, 2.5
          const opacityDivisor = 1 + i; // 1, 2, 3, 4
          
          const circleMarker = L.circleMarker([point.latitude, point.longitude], {
            radius: baseRadius * radiusMultiplier,
            fillColor: '#FF0000', // Bright Red
            color: i === 0 ? '#FFFFFF' : '#FF0000', // White border for main circle
            weight: i === 0 ? 1.5 : 0.5,
            fillOpacity: 0.8 / opacityDivisor,
            interactive: i === 0 // Only the center circle is interactive
          }).addTo(mapRef.current!);
          
          if (i === 0) {
            mainCircle = circleMarker;
            
            // Add click handler for the main extreme FRP marker
            circleMarker.on('click', function(e) {
              L.DomEvent.stopPropagation(e);
              const { lat, lng } = e.target.getLatLng();
              handleCoordinateUpdate(lat, lng);
            });
          }
        }
        
        // Add a pulsing effect marker
        L.circleMarker([point.latitude, point.longitude], {
          radius: baseRadius * 3,
          fillColor: '#FF3300',
          color: '#FF3300',
          weight: 0.5,
          fillOpacity: 0.2,
          className: 'pulse-marker',
          interactive: false
        }).addTo(mapRef.current!);
        
        // Add popup to the main circle
        if (mainCircle) {
          mainCircle.bindPopup(`
            <div style="text-align:center;">
              <h3 style="color:#FF0000;font-weight:bold;margin:0;">EXTREME FIRE</h3>
              <p style="margin:5px 0;"><strong>FRP:</strong> ${point.frp.toFixed(1)} MW</p>
              <p style="margin:5px 0;font-size:11px;">Latitude: ${point.latitude.toFixed(5)}</p>
              <p style="margin:5px 0;font-size:11px;">Longitude: ${point.longitude.toFixed(5)}</p>
            </div>
          `);
        }
      });
      
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
    
    // Clear user-added markers (but not fire markers)
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
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
      
      // Add click handler for custom markers
      circleMarker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        const { lat, lng } = e.target.getLatLng();
        handleCoordinateUpdate(lat, lng);
      });
      
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
          height: fullscreen ? 'calc(100vh - 48px)' : '280px',
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

export default AlaskaMap;