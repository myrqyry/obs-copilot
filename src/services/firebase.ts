// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCz5K9qMgUYiv0AUOK-1oHHmLsv5NxcAao",
    authDomain: "obs-copilot.firebaseapp.com",
    projectId: "obs-copilot",
    storageBucket: "obs-copilot.firebasestorage.app",
    messagingSenderId: "509692521391",
    appId: "1:509692521391:web:23ff81640616d673a69d5a",
    measurementId: "G-RDMH61S2SN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
