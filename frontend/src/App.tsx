import Map from './components/map/Map'

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">WildfireWatch</h1>
      <p className="mb-4">Real-time wildfire monitoring and resource allocation</p>
      <Map markers={wildfireMarkers} />
    </div>
  )
}

export default App