import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const apps = getApps();
let app;

if (!apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else if (process.env.NODE_ENV === 'production') {
    try {
      // Initialize with Application Default Credentials in production
      app = initializeApp();
    } catch (e) {
      throw new Error("Firebase Admin SDK failed to initialize. Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
    }
  } else {
    console.warn("Firebase Admin SDK running in development mode without server credentials. authAdmin and dbAdmin will be disabled.");
  }
} else {
  app = apps[0];
}

const dbAdmin = app ? getFirestore(app) : null;
const authAdmin = app ? getAuth(app) : null;

export { dbAdmin, authAdmin };
