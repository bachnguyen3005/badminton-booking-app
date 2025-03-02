// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, Timestamp } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChxCvaz2oeJmOVRbpanHwrZBHYceUGO9M",
  authDomain: "badminton-booking-app-de35f.firebaseapp.com",
  projectId: "badminton-booking-app-de35f",
  storageBucket: "badminton-booking-app-de35f.firebasestorage.app",
  messagingSenderId: "14723477115",
  appId: "1:14723477115:web:29acff5e33038cce473cde",
  measurementId: "G-YKKG01PVKF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firestore
const db = getFirestore(app);
// Utility function to convert JavaScript Date to Firestore Timestamp
export const dateToFirestore = (date) => {
  if (!date) return null;
  return Timestamp.fromDate(new Date(date));
};
export { db };