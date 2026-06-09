/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import { 
  doc, 
  getDocFromServer, 
  setDoc, 
  collection, 
  onSnapshot, 
  query,
  orderBy
} from "firebase/firestore";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";

interface FirebaseContextType {
  firebaseUser: FirebaseUser | null;
  authLoaded: boolean;
  connectionStatus: "testing" | "online" | "offline" | "error";
  errorDetail: string | null;
  firebaseDataActive: boolean;
  setFirebaseDataActive: (active: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  testCloudConnection: () => Promise<void>;
  saveDocumentToCloud: (collectionName: string, docId: string, data: any) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "online" | "offline" | "error">("testing");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  
  // Set Firebase replication/data active by default to give full cloud real-time capabilities
  const [firebaseDataActive, setFirebaseDataActive] = useState(() => {
    const saved = localStorage.getItem("qa_pulse_firebase_sync");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem("qa_pulse_firebase_sync", String(firebaseDataActive));
  }, [firebaseDataActive]);

  // Mandatory Connection Validation
  const testCloudConnection = async () => {
    setConnectionStatus("testing");
    setErrorDetail(null);
    try {
      // Perform the mandatory client check using getDocFromServer
      await getDocFromServer(doc(db, "test", "connection"));
      setConnectionStatus("online");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("the client is offline")) {
          setConnectionStatus("offline");
          setErrorDetail("The application appears to be offline. Verify your local connectivity.");
        } else if (error.message.includes("permission-denied") || error.message.includes("insufficient permissions")) {
          // If connection doc was rejected, Firestore itself is reached (rules blocked it, which is normal since it's a test doc)
          setConnectionStatus("online");
        } else {
          setConnectionStatus("error");
          setErrorDetail(error.message);
        }
      } else {
        setConnectionStatus("error");
        setErrorDetail(String(error));
      }
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoaded(true);
      testCloudConnection();
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      await testCloudConnection();
    } catch (err) {
      console.error("Google Popup Auth Error:", err);
      setErrorDetail(err instanceof Error ? err.message : String(err));
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      await testCloudConnection();
    } catch (err) {
      console.error("Sign Out Error:", err);
    }
  };

  // Helper inside SDK error wrapper
  const saveDocumentToCloud = async (collectionName: string, docId: string, data: any) => {
    if (!firebaseDataActive) return;
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data);
    } catch (err) {
      // Throw with strict JSON logging wrapper
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        authLoaded,
        connectionStatus,
        errorDetail,
        firebaseDataActive,
        setFirebaseDataActive,
        signInWithGoogle,
        signOutUser,
        testCloudConnection,
        saveDocumentToCloud,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}
