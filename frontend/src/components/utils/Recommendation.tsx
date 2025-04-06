import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../Lib/firebase";
import { useMapState } from "./mapstate"; // adjust the path if needed

const functions = getFunctions(app);
const generateRecommendations = httpsCallable(functions, "generateRecommendations");

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
        const result = await generateRecommendations({
          lat: currentLatitude,
          lng: currentLongitude,
          severity: currentSeverity,
          weather: `${currentWeather}, Temp: ${currentTemperature}°F, Wind: ${currentWindSpeed}mph, Humidity: ${currentHumidity}%`,
          population: currentPopulation,
          totalFires: totalactiveFires ?? 0,
          region: selectedRegion,
        });

        const { text } = result.data as { text: string };

        // Parse bullet points from Gemini response
        const bullets = text
          .split("\n")
          .filter((line) => line.trim().startsWith("•") || line.trim().startsWith("-"));

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

  return (
    <motion.div
      className="text-white w-full mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="bg-orange-400 rounded-xl p-1 shadow-lg">
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-orange-400 mb-2">
            AI Safety Recommendations
          </h2>

          {loading && (
            <p className="text-gray-400 italic">Generating smart suggestions...</p>
          )}

          {error && <p className="text-red-400">{error}</p>}

          {!loading && !error && recommendations.length > 0 && (
            <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-200">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span className="font-medium text-gray-500">Lat</span>
              <span>{currentLatitude?.toFixed(4)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span className="font-medium text-gray-500">Lng</span>
              <span>{currentLongitude?.toFixed(4)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span className="font-medium text-gray-500">Severity</span>
              <span>{currentSeverity}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span className="font-medium text-gray-500">Fires</span>
              <span>{totalactiveFires}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Recommendation;
