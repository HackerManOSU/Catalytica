import { db } from "../firebase";
import { Weather } from "../models/weather";

export async function addWeatherController(weatherData: Weather): Promise<void> {
    try{
        await db.collection("weather").add(weatherData);
    } catch (err) {
        console.log("Error adding weather: ", err);
        throw err;
    }
}

export async function getWeatherController(): Promise<Weather[]> {
    try {
        const snapshot = await db.collection("weather").get();
        return snapshot.docs.map(doc => {
          const weatherData = doc.data() as Weather;
          return { id: doc.id, ...weatherData };
        });
      } catch (err) {
        console.error("Error getting weather:", err);
        throw err;
      }
}