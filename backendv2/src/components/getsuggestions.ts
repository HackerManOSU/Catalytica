import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import { haversineDistance } from '../utils/haversine';

dotenv.config();

const app = express();
const port = 5002;


app.use(cors());
app.use(express.json());

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error("OpenAI API key is missing in .env file.");
}

interface NearbyReport {
  lat: number;
  lng: number;
  entry?: string;
}

router.post('/getsuggestions', async (req: Request, res: Response) => {
  const {
    lat, lng, weather, Temp, Wind, Humidity,
    severity, totalFires, population, region,
    nearbyReports = []
  }: {
    lat: number;
    lng: number;
    weather?: string;
    Temp?: number;
    Wind?: number;
    Humidity?: number;
    severity: string;
    totalFires: number;
    population: number;
    region: string;
    nearbyReports: NearbyReport[];
  } = req.body;

  try {
    if (lat == null || lng == null) {
      return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const temperature = Temp ?? "Unknown";
    const windSpeed = Wind ?? "Unknown";
    const humidity = Humidity ?? "Unknown";
    const currentWeather = weather || "Unknown";

    const hasTempData = Temp != null;
    const hasWindData = Wind != null;
    const hasHumidityData = Humidity != null;

    const sorted = nearbyReports
      .filter((r): r is NearbyReport => r?.lat != null && r?.lng != null)
      .map((r) => {
        const distanceMi = haversineDistance([lat, lng], [r.lat, r.lng]) * 0.621371;
        return {
          entry: r.entry || "No description",
          distance: distanceMi,
        };
      })
      .filter(r => r.distance <= 15)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 30);

    const reportSnippets = sorted.map(
      (r, i) => `${i + 1}. "${r.entry}" (${r.distance.toFixed(1)} mi)`
    );

    const prompt = `
You are a wildfire safety assistant providing personalized recommendations. Use ONLY the specific data provided below for this exact location.

EXACT USER DATA:
* Current Location: ${lat}, ${lng}
* Current Weather Condition: ${currentWeather}
${hasTempData ? `* Current Temperature: ${temperature}°F (Fahrenheit)` : '* Temperature: Data unavailable'}
${hasWindData ? `* Current Wind Speed: ${windSpeed} mph (miles per hour)` : '* Wind Speed: Data unavailable'}
${hasHumidityData ? `* Current Humidity: ${humidity}% (percent)` : '* Humidity: Data unavailable'}
* Current Fire Severity Level: ${severity}
* Number of Active Fires in Region: ${totalFires}
* Local Population: ${population}
* Geographic Region: ${region}

Nearby Fire Reports (within 15 miles):
${reportSnippets.join("\n")}

INSTRUCTIONS:
1. Format your response as EXACTLY 3 bullet points, each starting with * (asterisk)
2. Each bullet point should directly reference the available weather conditions and fire severity
3. For unavailable data (marked "Data unavailable"), do NOT make assumptions - instead, provide recommendations that don't depend on that specific data
4. ${hasTempData ? `Use the actual temperature of ${temperature}°F in your analysis` : 'Do not reference specific temperature values'}
5. ${hasWindData ? `Use the wind speed of ${windSpeed} mph in your analysis` : 'Do not reference specific wind speed values'}
6. ${hasHumidityData ? `Use the humidity of ${humidity}% in your analysis` : 'Do not reference specific humidity values'}
7. Make recommendations relevant to the specific location (${lat}, ${lng}) and region (${region})
8. Keep each recommendation under 50 words and ensure they are practical, specific actions
9. DO NOT include any text before or after the 3 bullet points`.trim();

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an assistant that generates wildfire safety recommendations.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0]?.message?.content?.trim();
    res.status(200).json({ recommendations: content });
  } catch (err: any) {
    console.error('OpenAI API error:', err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate recommendations." });
  }
});

app.use('/suggestions', router);

app.listen(port, '0.0.0.0', () => {
  console.log(`🔥 /getsuggestions service running on port ${port}`);
});
