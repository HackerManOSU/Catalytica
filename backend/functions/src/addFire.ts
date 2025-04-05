import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
    credential: applicationDefault()
});

const db = getFirestore();

async function addFire() {
    await
}

export default addFire