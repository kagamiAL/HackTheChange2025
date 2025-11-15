"use client";

import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys: Array<keyof typeof firebaseEnv> = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const envKeyMap: Record<keyof typeof firebaseEnv, string> = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
  measurementId: "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
};

function buildFirebaseConfig(): FirebaseOptions {
  const missingKeys = requiredKeys.filter((key) => !firebaseEnv[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingKeys
        .map((key) => envKeyMap[key])
        .join(", ")}`,
    );
  }

  const config: FirebaseOptions = {
    apiKey: firebaseEnv.apiKey!,
    authDomain: firebaseEnv.authDomain!,
    projectId: firebaseEnv.projectId!,
    storageBucket: firebaseEnv.storageBucket!,
    messagingSenderId: firebaseEnv.messagingSenderId!,
    appId: firebaseEnv.appId!,
  };

  if (firebaseEnv.measurementId) {
    config.measurementId = firebaseEnv.measurementId;
  }

  return config;
}

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length ? getApp() : initializeApp(buildFirebaseConfig());
  return firebaseApp;
}

let authInstance: ReturnType<typeof getAuth> | null = null;

export function getFirebaseAuth() {
  if (authInstance) {
    return authInstance;
  }

  authInstance = getAuth(getFirebaseApp());
  return authInstance;
}
