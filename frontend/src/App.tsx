import USMap from './components/Maps/USMap';
import HawaiiMap from './components/Maps/HawaiiMap';
import AlaskaMap from './components/Maps/AlaskaMap';
import { requestAndStoreLocation } from './components/GeoLocation/location';
import { useEffect } from "react";

import { motion } from 'framer-motion';


function App() {
  // Sample data for testing
  const wildfireMarkers = [
    {
      position: [37.7749, -122.4194] as [number, number], // San Francisco
      severity: 8,
      details: "High severity wildfire in San Francisco area. Evacuation recommended."
    },
    {
      position: [34.0522, -118.2437] as [number, number], // Los Angeles
      severity: 5,
      details: "Moderate wildfire detected near Los Angeles."
    },
    {
      position: [39.7392, -104.9903] as [number, number], // Denver
      severity: 3,
      details: "Low severity fire near Denver."
    }
  ];


  useEffect(() => {
    requestAndStoreLocation();
  }, []);

  return (
    <div className="p-4 bg-[black] min-h-screen">
      <div className="flex-grow flex items-center justify-center">
        <motion.div
          className="text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-bold mb-4">WildfireWatch</h1>
          <p className="text-xl mb-8">Real-time wildfire monitoring and resource allocation</p>
        </motion.div>
      </div>
      
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left column for Alaska and Hawaii */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div style={{ height: "300px" }}>
              <h2 className="text-white text-xl font-semibold mb-2">Alaska</h2>
              <div style={{ height: "280px" }}>
                <AlaskaMap markers={wildfireMarkers} />
              </div>
            </div>
            <div style={{ height: "300px" }}>
              <h2 className="text-white text-xl font-semibold mb-2">Hawaii</h2>
              <div style={{ height: "280px" }}>
                <HawaiiMap markers={wildfireMarkers} />
              </div>
            </div>
          </div>
          
          {/* Right column for main US map */}
          <div className="md:col-span-3">
            <h2 className="text-white text-xl font-semibold mb-2">Mainland US</h2>
            <div style={{ height: "600px" }}>
              <USMap markers={wildfireMarkers} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
