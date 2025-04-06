import { db } from "../weatherbase";
import { Weather } from "../models/weather";
import { Timestamp } from "weatherbase/weatherstore";

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
        const snapshot = await db.collection("weathers").get();
        return snapshot.docs.map(doc => {
          const weatherData = doc.data() as Weather;
          if (weatherData.report_date instanceof Timestamp) {
            weatherData.report_date = weatherData.report_date.toDate();
          }
          return { id: doc.id, ...weatherData };
        });
      } catch (err) {
        console.error("Error getting weathers:", err);
        throw err;
      }
}