import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC0AJmqMC7GEfU9XxNTG0p5IMMa6fkMWxo",
  authDomain: "dvafinalproject-5505b.firebaseapp.com",
  projectId: "dvafinalproject-5505b",
  storageBucket: "dvafinalproject-5505b.firebasestorage.app",
  messagingSenderId: "607258902130",
  appId: "1:607258902130:web:b5fb80c8ca428ef0460ceb",
  measurementId: "G-DBM0P6EFTS"
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
