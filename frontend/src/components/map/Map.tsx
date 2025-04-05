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

    const Map = ({ 
    center = [37.8, -96], // Default center of USA
    zoom = 4.5,
    markers = [] 
    }: MapProps) => {
    // Create a reference to store the map instance
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize map only once when component mounts
        if (!mapContainerRef.current || mapRef.current) return;

        // Create Leaflet map instance
        mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        }).addTo(mapRef.current);

        // Cleanup function to remove map when component unmounts
        return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
        };
    }, [center, zoom]);

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
            circleMarker.bindPopup(marker.details);
        }
        });
    }, [markers]);

    return (
        <div 
        ref={mapContainerRef} 
        style={{ 
            height: '600px', 
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }} 
        className="map-container" 
        />
    );
    };

    export default Map;