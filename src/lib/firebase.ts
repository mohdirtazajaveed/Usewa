import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore — getReactNativePersistence exists at runtime but isn't typed in this SDK version
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAhuJCxK-TcSg6gEhzfluwUfcCrBXejqwg',
  authDomain: 'u-sewa.firebaseapp.com',
  projectId: 'u-sewa',
  storageBucket: 'u-sewa.firebasestorage.app',
  messagingSenderId: '818199101812',
  appId: '1:818199101812:web:03e8494f0001a7e960ac21',
};

// Avoid re-initializing if this file gets loaded more than once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use AsyncStorage so the user stays logged in between app restarts
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // initializeAuth throws if it's already been called once (e.g. fast refresh)
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };