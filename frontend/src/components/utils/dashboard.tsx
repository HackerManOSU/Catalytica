import { motion } from 'framer-motion';
import {useState, useEffect, useCallback} from 'react';
import { MapActions, useMapState,  useMapDispatch } from './mapstate'; // Import the map dispatch
import Recommendation from './Recommendation';
import { getFIRMS, FIRMSData } from '../../services/firmsService';
import FireAnimation from './fireicon'; // Add this import


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
    const arcLength = 283; // Length of the arc (half of the circle's circumference)
    const offset = (1 - value / 10) * arcLength; // Adjusted for a 0–10 scale
  
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
        <motion.path
          d="M10 90 A80 80 0 0 1 190 90"
          fill="none" 
          stroke="#ff9966" 
          strokeWidth="20"
          strokeDasharray={arcLength}
          strokeDashoffset={offset}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6 }}
        />
  
        {/* Value text */}
        <text 
          x="100" 
          y="70" 
          textAnchor="middle" 
          fontSize="30" 
          fill="#ff9966"
        >
          {value.toFixed(1)}
        </text>
      </svg>
    );
  };
  

  const Dashboard: React.FC = () => {
    const mapState = useMapState();
    const mapDispatch = useMapDispatch(); 

    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const getWeatherAdjustment = useCallback(() => {
      let adjustment = 1.0; // Default multiplier (no change)
      
      // Wind speed adjustment - increases severity
      if (mapState.currentWindSpeed) {
        // Wind over 15mph significantly increases fire risk
        const windFactor = Math.min((mapState.currentWindSpeed / 15) * 0.3, 0.5);
        adjustment += windFactor;
      }
      
      // Humidity adjustment - decreases severity
      if (mapState.currentHumidity) {
        // Higher humidity reduces fire risk
        const humidityFactor = Math.min((mapState.currentHumidity / 100) * 0.4, 0.4);
        adjustment -= humidityFactor;
      }
      
      // Temperature adjustment - increases severity
      if (mapState.currentTemperature) {
        // Temperatures above 80°F increase fire risk
        const tempFactor = mapState.currentTemperature > 80 
          ? Math.min(((mapState.currentTemperature - 80) / 30) * 0.3, 0.3)
          : 0;
        adjustment += tempFactor;
      }
      
      // Weather conditions adjustment
      const weatherLower = (mapState.currentWeather || "").toLowerCase();
      if (weatherLower.includes("rain") || weatherLower.includes("shower")) {
        adjustment -= 0.3; // Rain significantly reduces fire risk
      } else if (weatherLower.includes("snow") || weatherLower.includes("sleet")) {
        adjustment -= 0.5; // Snow/ice conditions drastically reduce fire risk
      } else if (weatherLower.includes("fog") || weatherLower.includes("mist")) {
        adjustment -= 0.2; // Foggy conditions reduce fire risk slightly
      } else if (weatherLower.includes("thunder") || weatherLower.includes("lightning")) {
        adjustment += 0.2; // Lightning can increase fire risk
      } else if (weatherLower.includes("clear") || weatherLower.includes("sunny")) {
        adjustment += 0.1; // Clear conditions slightly increase risk
      }
      
      // Keep adjustment within reasonable bounds (0.5 to 1.7)
      return Math.max(0.5, Math.min(adjustment, 1.7));
    }, [mapState.currentWindSpeed, mapState.currentHumidity, mapState.currentTemperature, mapState.currentWeather]);
  
    const weatherAdjustment = getWeatherAdjustment();
    const baseSeverity = mapState.currentSeverity
      ? (mapState.currentSeverity >= 1000 
         ? 10 
         : 1 + (mapState.currentSeverity * 9) / 1000)
      : 0;
    const scaledSeverity = Math.min(10, baseSeverity * weatherAdjustment);

      const resetDashboardState = useCallback(() => {
        mapDispatch(MapActions.setTotalactiveFires(0));
        mapDispatch(MapActions.setCurrentWeather("No data"));
        mapDispatch(MapActions.setCurrentTemperature(null));
        mapDispatch(MapActions.setCurrentHumidity(null));
        mapDispatch(MapActions.setCurrentWindSpeed(null));
        mapDispatch(MapActions.setCurrentSeverity(0));
        mapDispatch(MapActions.setSelectedRegion("None"));
        mapDispatch(MapActions.setCurrentPopulation(0));
      }, [mapDispatch]);
    

    useEffect(() => {
 
      const fetchPopulationFromJSON = async (county: string): Promise<number> => {
        try {
          const res = await fetch("/assets/population.json");
          const data = await res.json();
      
          const normalizedCounty = county.trim().toLowerCase();
      
          for (const row of data) {
            const rawName = row["table with row headers in column A and column headers in rows 3 through 4 (leading dots indicate sub-parts)"];
            if (!rawName) continue;
      
            const cleanedName = rawName.replace(/^\./, "").trim().toLowerCase();
      
            if (cleanedName.startsWith(normalizedCounty)) {
              const latestPopStr = row["__5"]; // 2024 population
              const population = parseInt(latestPopStr.replace(/,/g, ""), 10);
              return isNaN(population) ? 0 : population;
            }
          }
      
          return 0;
        } catch (err) {
          console.error("Failed to load or parse local population data:", err);
          return 0;
        }
      };
    
      
      const fetchNearestCity = async (lat: number, lng: number) => {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${import.meta.env.VITE_OPEN_CAGE_KEY}`;
      
        const response = await fetch(url);
        const data = await response.json();
      
        const city = data?.results?.[0]?.components?.county ||
                     data?.results?.[0]?.components?.city ||
                     data?.results?.[0]?.components?.town ||
                     data?.results?.[0]?.components?.village ||
                     "Unknown";
                     
        return city;
      };
      
      const fetchFirmsUpdates = async () => {
        if (!mapState.currentLatitude || !mapState.currentLongitude) {
          console.warn("Latitude or Longitude not set");
          resetDashboardState();
          return;
        }

        try {
          // Use the imported service instead of direct Firestore calls
          const firmsData = await getFIRMS();
          
          const allFires: FIRMSData[] = [];
      
          // Filter fires based on distance criteria
          firmsData.forEach(fireEntry => {
            if (
              typeof fireEntry.latitude === "number" &&
              typeof fireEntry.longitude === "number" &&
              fireEntry.weather
            ) {
              const distance = haversineDistance(
                mapState.currentLatitude!,
                mapState.currentLongitude!,
                fireEntry.latitude,
                fireEntry.longitude
              );
              const distanceMiles = distance * 0.621371;
      
              if (distanceMiles <= 15) {
                allFires.push({ ...fireEntry, distance: distanceMiles });
              }
            }
          });
      
          const filteredFires = allFires
            .filter(f => !isNaN(f.distance as number) && (f.distance as number) <= 50);
      
          const nearestFires = filteredFires
            .sort((a, b) => (a.distance as number) - (b.distance as number))
            .slice(0, 50);
      
          // Update global state
          mapDispatch(MapActions.setTotalactiveFires(nearestFires.length));
      
          if (nearestFires[0]) {
            const closest = nearestFires[0];
      
            mapDispatch(MapActions.setCurrentWeather(closest.weather?.weather_desc || "No data"));
            mapDispatch(MapActions.setCurrentTemperature(closest.weather?.temperature || 0));
            mapDispatch(MapActions.setCurrentHumidity(closest.weather?.humidity || 0));
            mapDispatch(MapActions.setCurrentWindSpeed(closest.weather?.wind_speed || 0));
            mapDispatch(MapActions.setCurrentSeverity(closest.frp || 0));

            setIsLoadingLocation(true);

            const city = await fetchNearestCity(closest.latitude, closest.longitude);
            mapDispatch(MapActions.setSelectedRegion(city));
            const population = await fetchPopulationFromJSON(city);
            mapDispatch(MapActions.setCurrentPopulation(population));

            setIsLoadingLocation(false);
            } else {
              resetDashboardState();
            }
        
            console.log("Nearest fires:", nearestFires);
          } catch (error) {
            console.error("Error fetching fire data:", error);
            resetDashboardState();
            setIsLoadingLocation(false); // Ensure loading state is turned off on error

        }
      };
      
    
      fetchFirmsUpdates();
    }, [mapState.currentLatitude, mapState.currentLongitude, mapDispatch, resetDashboardState]);
    
  return (
    <motion.div
      className="text-white w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Severity Speedometer */}
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center border-3 border-orange-400">
          <h2 className="text-2xl font-semibold mb-4">Fire Severity</h2>
          <Speedometer value={+scaledSeverity.toFixed(2)} />
          <p className="mt-4 text-orange-500 font-bold">Risk</p>
          {weatherAdjustment !== 1 && (
            <div className="mt-2 text-sm">
              <p className={`${weatherAdjustment > 1 ? 'text-red-400' : 'text-green-400'}`}>
                Weather {weatherAdjustment > 1 ? 'increases' : 'decreases'} risk by {Math.abs((weatherAdjustment - 1) * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        {/* Active Fires */}
        <div className="bg-gray-800 rounded-lg p-6 border-3 border-orange-400">
          <h2 className="text-2xl font-semibold mb-4">Active Fires</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-bold text-orange-500">{mapState.totalactiveFires || 0}</p>
              <p className="text-sm text-gray-400">Current Fires in 15 mile radius</p>
            </div>
            
          </div>
          <h2 className="text-2xl font-semibold  mt-4">Weather</h2>
          <div>
            <p className="text-1xl font-bold text-orange-500">
                Conditions: {mapState.currentWeather || "None"}
            </p>
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
        <div className="bg-gray-800 rounded-lg p-6 border-3 border-orange-400">
          <h2 className="text-2xl font-semibold mb-4">Total Population</h2>
          <div className="flex flex-col">
            <div>
              {isLoadingLocation ? (
                <div className="flex items-center justify-center py-4">
                  <FireAnimation size={60} isVisible={true} />
                </div>
              ) : (
                <>
                  <p className="text-5xl font-bold text-orange-500">{mapState.currentPopulation || "N/A"}</p>
                  <p className="text-sm text-gray-400">People</p>
                </>
              )}
            </div>
            <h2 className="text-2xl font-semibold mb-4 mt-4">Area</h2>
            <div>
              {isLoadingLocation ? (
                <div className="flex items-center justify-center py-4">
                  <FireAnimation size={60} isVisible={true} />
                </div>
              ) : (
                <p className="text-5xl font-bold text-orange-500">{mapState.selectedRegion || "None"}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Recommendation />


    </motion.div>
    
  );
};

export default Dashboard;