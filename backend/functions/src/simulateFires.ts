import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

function createRandomFire() {
    const lat = 45 + (Math.random() * 2 - 1);
    const lon = -122 + (Math.random() * 2 - 1);
    const severity = Math.floor(Math.random() * 10) + 1;
    const descriptions = [
        "Wildfire near the river",
        "Forest fire spotted",
        "Brush fire reported",
        "Controlled burn out of control",
        "Lightning strike fire"
    ];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    return {
        lat,
        lon,
        severity,
        description,
        updated_at: new Date()
    };
}

