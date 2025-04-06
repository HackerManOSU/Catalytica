import { motion } from 'framer-motion';
import {useState, useEffect} from 'react';
import { MapActions, useMapState,  useMapDispatch } from '../utils/mapstate'; // Import the map dispatch
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../Lib/firebase';

function haversineDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

const Speedometer: React.FC<{ value: number }> = ({ value }) => {
    return (
      <svg viewBox="0 0 200 100" width="250" height="200">
        {/* Background arc - full length */}
        <path 
          d="M10 90 A80 80 0 0 1 190 90" 
          fill="none" 
          stroke="#333" 
          strokeWidth="20" 
        />
        
        {/* Value arc */}
        <path 
          d={`M10 90 A80 80 0 0 1 190 90`}
          fill="none" 
          stroke="#ff9966" 
          strokeWidth="20"
          strokeDasharray={`${(value / 100) * 251.33}, 251.33`}
        />
        
        {/* Value text */}
        <text 
          x="100" 
          y="70" 
          textAnchor="middle" 
          fontSize="30" 
          fill="#ff9966"
        >
          {value}%
        </text>
      </svg>
    );
  };

  const Dashboard: React.FC = () => {
    const mapState = useMapState();
    const mapDispatch = useMapDispatch(); 
    

    useEffect(() => {
        const fetchNearestData = async () => {
            // Check if latitude and longitude are valid
            if (!mapState.currentLatitude || !mapState.currentLongitude) return;
    
            try {
                // Fetch from Firewatch collection
                const firewatchRef = collection(db, 'Firewatch');
                const firewatchSnapshot = await getDocs(firewatchRef);
                
                const nearestFires = firewatchSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        distance: haversineDistance(
                            mapState.currentLatitude!, 
                            mapState.currentLongitude!, 
                            doc.data().latitude, 
                            doc.data().longitude
                        )
                    }))
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 5); // Get 5 nearest fires
    
                // Fetch from WeatherUpdates collection
                const weatherRef = collection(db, 'weatherUpdates');
                const weatherSnapshot = await getDocs(weatherRef);
                
                const nearestWeather = weatherSnapshot.docs
                    .map(doc => {
                        const docData = doc.data();
                        return {
                            id: doc.id,
                            ...docData,
                            apiData: docData.data, // The OpenWeatherMap data is nested in 'data'
                            timestamp: docData.timestamp,
                            distance: docData.data?.coord ? haversineDistance(
                                mapState.currentLatitude!, 
                                mapState.currentLongitude!, 
                                docData.data.coord.lat, 
                                docData.data.coord.lon
                            ) : NaN
                        };
                    })
                    .filter(fire => fire.distance <= 100) // Optional: filter out entries with NaN distance
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 5);
                // Update global state with the nearest fire and weather data
                if (nearestWeather[0]?.apiData) {
                    mapDispatch(MapActions.setCurrentWeather(
                        nearestWeather[0].apiData.weather[0]?.description || 'No weather data'
                    ));
                    mapDispatch(MapActions.setSelectedRegion(
                        nearestWeather[0].apiData.name || 'No region data'
                    ));
                    mapDispatch(MapActions.setCurrentHumidity(
                        nearestWeather[0].apiData.main?.humidity || 0
                    ));
                    mapDispatch(MapActions.setCurrentWindSpeed(
                        nearestWeather[0].apiData.wind?.speed || 0
                    ));
                    mapDispatch(MapActions.setCurrentTemperature(
                        nearestWeather[0].apiData.main?.temp || 0
                    ));
                }
                console.log('Nearest Fires:', nearestFires);

    
                if (nearestFires[0]) {
                    mapDispatch(MapActions.setTotalactiveFires(
                        nearestFires.length || 0
                    ));
                }
    
            } catch (error) {
                console.error('Error fetching nearest data:', error);
            }
        };
    
        fetchNearestData();
    }, [mapState.currentLatitude, mapState.currentLongitude, mapDispatch]);
  return (
    <motion.div
      className="text-white w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Severity Speedometer */}
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Fire Severity</h2>
          <Speedometer value={90} />
          <p className="mt-4 text-orange-500 font-bold">Risk</p>
        </div>

        {/* Active Fires */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Active Fires</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-bold text-orange-500">{mapState.totalactiveFires || 0}</p>
              <p className="text-sm text-gray-400">Current Fires in 100 mile radius</p>
            </div>
            
          </div>
          <h2 className="text-2xl font-semibold  mt-4">Weather</h2>
          <div>
            <p className="text-1xl font-bold text-orange-500">
                Temp: {mapState.currentTemperature !== null 
                    ? `${Math.round(mapState.currentTemperature)}°F` 
                    : "None"}
            </p>
            <p className="text-1xl font-bold text-orange-500">
                Wind: {mapState.currentWindSpeed !== null 
                    ? `${Math.round(mapState.currentWindSpeed)} mph` 
                    : "None"}
            </p>
            <p className="text-1xl font-bold text-orange-500">
                Humidity: {mapState.currentHumidity !== null 
                    ? `${mapState.currentHumidity}%` 
                    : "None"}
            </p>
          </div>

        </div>

        {/* Affected Area */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Total Population</h2>
          <div className="flex flex-col ">
            <div>
              <p className="text-5xl font-bold text-orange-500">4,250</p>
              <p className="text-sm text-gray-400">People</p>
            </div>
            <h2 className="text-2xl font-semibold mb-4 mt-4">Nearest City</h2>
            <div>
              <p className="text-5xl font-bold text-orange-500">{mapState.selectedRegion || "None"}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;