import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMapState } from "./mapstate";

const Recommendation: React.FC = () => {
  const {
    currentLatitude,
    currentLongitude,
    currentSeverity,
    currentWeather,
    currentWindSpeed,
    currentHumidity,
    currentTemperature,
    totalactiveFires,
    selectedRegion,
    currentPopulation,
  } = useMapState();

  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (
        currentLatitude == null ||
        currentLongitude == null ||
        currentSeverity == null ||
        currentWeather == null
      ) return;

      setLoading(true);
      setError("");
      setRecommendations([]);

      try {
        const response = await fetch(
          "https://us-central1-catalytica-b8ad9.cloudfunctions.net/generateRecommendations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat: currentLatitude,
              lng: currentLongitude,
              severity: currentSeverity,
              weather: currentWeather, 
              Temp: currentTemperature, 
              Wind: currentWindSpeed,
              Humidity: currentHumidity,
              population: currentPopulation,
              totalFires: totalactiveFires ?? 0,
              region: selectedRegion,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }

        const data = await response.json();
        const text = data.recommendations;

        const bullets = text
          .split("\n")
          .filter((line: string) => line.trim().startsWith("•") || line.trim().startsWith("-"));

        setRecommendations(bullets.length ? bullets : [text]);
      } catch (err) {
        console.error("Gemini API call failed:", err);
        setError("Could not generate recommendations.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [
    currentLatitude,
    currentLongitude,
    currentSeverity,
    currentWeather,
    currentWindSpeed,
    currentHumidity,
    currentTemperature,
    totalactiveFires,
    selectedRegion,
    currentPopulation,
  ]);

  const formatRecommendation = (text: string) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-orange-400">$1</span>');
    
    formatted = formatted.replace(/^\s*\*\s*/g, '');
    
    formatted = formatted.replace(/\s*\*\s*/g, '<br /><br />');
    
    return formatted;
  };

  return (
    <motion.div
      className="text-white w-full mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="bg-orange-400 rounded-xl p-1 shadow-lg">
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-orange-400 mb-4">
            AI Safety Recommendations
          </h2>

          {loading && (
            <p className="text-gray-400 italic">Generating smart suggestions...</p>
          )}

          {error && <p className="text-red-400">{error}</p>}

          {!loading && !error && recommendations.length > 0 && (
            <ul className="list-none space-y-4 mb-6 text-gray-200">
              {recommendations.map((rec, i) => (
                <li key={i} className="pl-4 border-l-2 border-orange-400">
                  <div dangerouslySetInnerHTML={{ __html: formatRecommendation(rec) }} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3 font-semibold">Location Data</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Latitude</span>
                <span className="text-lg text-white font-medium">{currentLatitude?.toFixed(4) || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Longitude</span>
                <span className="text-lg text-white font-medium">{currentLongitude?.toFixed(4) || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Fire Severity</span>
                <span className="text-lg text-white font-medium">{currentSeverity || "Unknown"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Active Fires</span>
                <span className="text-lg text-white font-medium">{totalactiveFires || "0"}</span>
              </div>
            </div>
          </div>
          
          {currentWeather && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3 font-semibold">Weather Conditions</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Temperature</span>
                  <span className="text-lg text-white font-medium">{currentTemperature}°F</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Wind Speed</span>
                  <span className="text-lg text-white font-medium">{currentWindSpeed} mph</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Humidity</span>
                  <span className="text-lg text-white font-medium">{currentHumidity}%</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-500 mb-1">Conditions</span>
                <span className="block text-white">{currentWeather}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Recommendation;