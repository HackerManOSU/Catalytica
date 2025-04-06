import { DocumentReference } from "firebase/firestore";

export interface Fire {

    lat: number;
    lon: number;
    severity: number;
    description: string;
    report_date: Date;
    weather: DocumentReference;
}
