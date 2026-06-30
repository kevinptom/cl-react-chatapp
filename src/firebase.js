import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyACnC40Nga0wd5kA3vWhWdzUoe961lu44c",
  authDomain: "react-chat-app-a2644.firebaseapp.com",
  projectId: "react-chat-app-a2644",
  storageBucket: "react-chat-app-a2644.firebasestorage.app",
  messagingSenderId: "432856167538",
  appId: "1:432856167538:web:1b042076f415a4007f7eeb",
  measurementId: "G-435RKKV7EG"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const dataConverter = {
  toFirestore(data) {
    return data;
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    };
  }
};