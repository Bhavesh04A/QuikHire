import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyAVdhvYu9exeH5HLvIxEy7XX5ZE4FZEq3I",
    authDomain: "quickhire-18a1d.firebaseapp.com",
    projectId: "quickhire-18a1d",
    storageBucket: "quickhire-18a1d.firebasestorage.app",
    messagingSenderId: "208870814593",
    appId: "1:208870814593:web:badc7f06191803f8b46e80",
    measurementId: "G-R2WCFDL25N"
};


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;