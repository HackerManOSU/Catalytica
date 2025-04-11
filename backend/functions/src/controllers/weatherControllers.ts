import admin from 'firebase-admin';
import { Weather } from '../models/weather'

const db = admin.firestore();

// -----------------------------
// Weather-related Interfaces & Controllers
// -----------------------------

export async function addWeatherController(weatherData: Weather) {
  try {
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
  }
  catch (err) {
    console.error("Error getting weather:", err);
    throw err;
  }
}

// export async function deleteWeatherController(weatherId: String) {
//     try {
//         const result = await 
//     }
// }
