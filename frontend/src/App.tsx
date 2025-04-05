import Map from './components/map/Map'
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
      
      <Map markers={wildfireMarkers} />
    </div>
  )
}

export default App