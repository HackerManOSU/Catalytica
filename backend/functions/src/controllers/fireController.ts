import { db } from "../firebase"; // Ensure this imports the Firestore instance
import { Fire } from "../models/fire";
import { Weather } from "../models/weather";
import { Timestamp, DocumentReference, getDoc } from "firebase/firestore"; // Correct imports for Firestore

export async function addFireController(fireData: Fire): Promise<void> {
  try {
    if (!fireData.weather || !(fireData.weather instanceof DocumentReference)) {
      throw new Error("Invalid weather reference.");
    }
    await db.collection("fires").add({
      ...fireData,
      report_date: fireData.report_date instanceof Date ? fireData.report_date : new Date(),
    });
  } catch (err) {
    console.error("Error adding fire:", err);
    throw err;
  }
}

// Create an extended interface for the data we return
export interface FireWithWeatherData extends Omit<Fire, 'weather'> {
  id: string;
  weather: Weather | null;
}

export async function getFiresController(): Promise<FireWithWeatherData[]> {
  try {
    const snapshot = await db.collection("fires").get();
    const fires = await Promise.all(
      snapshot.docs.map(async doc => {
        const fireData = doc.data() as Fire;
        if (fireData.report_date instanceof Timestamp) {
          fireData.report_date = fireData.report_date.toDate();
        }
        
        // Fetch weather using the DocRef
        let weatherData: Weather | null = null;
        if (fireData.weather instanceof DocumentReference) {
          const weatherDoc = await getDoc(fireData.weather);
          if (weatherDoc.exists()) {
            weatherData = weatherDoc.data() as Weather;
          }
        }
        
        // Create and return a FireWithWeatherData object
        return { 
          id: doc.id, 
          lat: fireData.lat,
          lon: fireData.lon,
          severity: fireData.severity,
          description: fireData.description,
          report_date: fireData.report_date,
          weather: weatherData 
        };
      })
    );
    return fires;
  } catch (err) {
    console.error("Error getting fires:", err);
    throw err;
  }
}