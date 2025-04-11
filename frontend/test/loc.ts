import { getDistance } from 'geolib';

console.log('🔥 Script is running...');

interface SampleLocation {
  lab_id: string;
  lat_wgs84: number;
  long_wgs84: number;
}

interface ConcentrationRecord {
  lab_id: string;
  species: string;
  unit: string;
  qvalue: number;
}

const sampleLocations: SampleLocation[] = [
  { lab_id: '64M1561', lat_wgs84: 59.24211286, long_wgs84: -154.50691082 },
  { lab_id: '64M1563', lat_wgs84: 59.24272598, long_wgs84: -154.49314672 },
];

const concentrationData: ConcentrationRecord[] = [
  { lab_id: '64M1561', species: 'Cr', unit: 'ppm', qvalue: 70 },
  { lab_id: '64M1561', species: 'Cu', unit: 'ppm', qvalue: 500 },
  { lab_id: '64M1561', species: 'Hg', unit: 'ppm', qvalue: -1000 },
  { lab_id: '64M1563', species: 'Co', unit: 'ppm', qvalue: 33 },
];

const wildfireLat = 59.2421;
const wildfireLon = -154.5070;

function findClosestSample(lat: number, lon: number): SampleLocation | null {
  let closest: SampleLocation | null = null;
  let minDist = Infinity;

  for (const sample of sampleLocations) {
    const distance = getDistance(
      { latitude: lat, longitude: lon },
      { latitude: sample.lat_wgs84, longitude: sample.long_wgs84 }
    );

    if (distance < minDist) {
      minDist = distance;
      closest = sample;
    }
  }

  return closest;
}

function getPPMValuesForLab(labId: string): ConcentrationRecord[] {
  return concentrationData.filter(
    (rec) => rec.lab_id === labId && rec.unit === 'ppm'
  );
}

const closest = findClosestSample(wildfireLat, wildfireLon);

if (closest) {
  console.log(`Closest sample lab_id: ${closest.lab_id}`);
  console.log(`Location: (${closest.lat_wgs84}, ${closest.long_wgs84})`);

  const ppmResults = getPPMValuesForLab(closest.lab_id);

  if (ppmResults.length > 0) {
    console.log(`\nMetal Concentrations (PPM):`);
    for (const rec of ppmResults) {
      const displayValue = rec.qvalue < 0 ? 'Below detection limit' : `${rec.qvalue} ppm`;
      console.log(`- ${rec.species}: ${displayValue}`);
    }
  } else {
    console.log(`\nNo PPM values found for lab_id ${closest.lab_id}`);
  }
} else {
  console.log(`No matching sample found.`);
}
