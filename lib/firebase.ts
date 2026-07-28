import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore specifying the database id ('pdfbooks')
const db = getFirestore(app, "pdfbooks");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMsg = message.toLowerCase();
  if (
    lowerMsg.includes('offline') || 
    lowerMsg.includes('failed to get document') || 
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('network')
  ) {
    console.warn(`Firestore offline mode active for ${operationType} on ${path}: ${message}`);
    return;
  }

  const errInfo = {
    error: message,
    operationType,
    path
  };
  console.warn('Firestore Notice:', message, errInfo);
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore status: Client is offline or establishing connection.");
    }
  }
}
if (typeof window !== "undefined") {
  testConnection();
}

export { app, auth, googleProvider, db, signInWithPopup, signOut };
