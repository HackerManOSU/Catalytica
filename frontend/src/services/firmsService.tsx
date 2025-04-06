import { db } from '../Lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface FIRMSData {
  acq_date: string;
  acq_time: string;
  bright_t31: number;
  brightness: number;
  confidence: number;
  country_id?: string;
  daynight?: string;
  frp: number;
  instrument?: string;
  latitude: number;
  longitude: number;
  satellite?: string;
  scan: number;
  track: number;
  version?: string;
  weather: {
    humidity: number;
    temperature: number;
    weather_desc: string;
    wind_direction: number;
    wind_speed: number;
  };
}

/**
 * Fetch FIRMS data from Firestore database
 * @returns Array of FIRMS data points
 */
export const getFIRMS = async (): Promise<FIRMSData[]> => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA?.toLowerCase() === 'true';
  if (useMockData) {
    console.warn('Using mock data for FIRMS API');
    return getFallbackMockData();
  }
  
  try {
    const firmsRef = collection(db, 'firmsUpdates');
    const snapshot = await getDocs(firmsRef);
    
    const firmsData: FIRMSData[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log("Processing doc:", doc.id);
      
      Object.values(data).forEach((entryGroup: any) => {
        if (Array.isArray(entryGroup)) {
          entryGroup.forEach((fireEntry: any) => {
            if (
              typeof fireEntry.latitude === "number" &&
              typeof fireEntry.longitude === "number"
            ) {
              firmsData.push({
                latitude: fireEntry.latitude || 0,
                longitude: fireEntry.longitude || 0,
                brightness: parseFloat(fireEntry.bright_ti4) || 0,
                scan: parseFloat(fireEntry.scan) || 1,
                track: parseFloat(fireEntry.track) || 1,
                acq_date: fireEntry.acq_date || new Date().toISOString().split('T')[0],
                acq_time: fireEntry.acq_time || "0000",
                confidence: fireEntry.confidence === 'h' ? 90 : 
                           fireEntry.confidence === 'n' ? 50 : 
                           parseFloat(fireEntry.confidence) || 80,
                bright_t31: parseFloat(fireEntry.bright_ti5) || 280,
                frp: parseFloat(fireEntry.frp) || 30,
                weather: {
                  humidity: fireEntry.weather?.humidity || 0,
                  temperature: fireEntry.weather?.temperature || 0,
                  weather_desc: fireEntry.weather?.weather_desc || '',
                  wind_direction: fireEntry.weather?.wind_direction || 0,
                  wind_speed: fireEntry.weather?.wind_speed || 0,
                }
              });
            }
          });
        }
      });
    });

    return firmsData;
  } catch (err) {
    console.error('Error fetching FIRMS data from Firestore:', err);
    return getFallbackMockData();
  }
};

/**
 * Provides fallback mock data when the Firestore request fails
 */
function getFallbackMockData(): FIRMSData[] {
  // Mock data for US wildfires
  const mockData: FIRMSData[] = [
    // California wildfires
    { 
      latitude: 37.7749, 
      longitude: -122.4194, 
      brightness: 340.5, 
      scan: 1, 
      track: 1, 
      acq_date: "2024-07-15", 
      acq_time: "0400", 
      confidence: 95, 
      bright_t31: 290.5, 
      frp: 999.2,
      weather: {
        humidity: 45,
        temperature: 85,
        weather_desc: "Partly Cloudy",
        wind_direction: 270,
        wind_speed: 8
      }
    },
    { 
      latitude: 44.7749, 
      longitude: -122.4194, 
      brightness: 340.5, 
      scan: 1, 
      track: 1, 
      acq_date: "2024-07-15", 
      acq_time: "0400", 
      confidence: 95, 
      bright_t31: 290.5, 
      frp: 500.2,
      weather: {
        humidity: 45,
        temperature: 85,
        weather_desc: "Partly Cloudy",
        wind_direction: 270,
        wind_speed: 8
      }
    },
    // More mock data entries with weather info...
    // ...existing mock data with added weather property
  ];

  return mockData;
  
}

export const fetchRecentFIRMSData = getFIRMS;