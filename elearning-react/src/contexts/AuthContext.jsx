import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  getAdditionalUserInfo
} from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import Loader from '../components/Loader';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function saveUserToFirestore(user, displayName) {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const newUser = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || user.email,
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        profileComplete: false
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
    return userSnap.data();
  }

  async function register(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
      // Update the local state so it reflects immediately
      setUser({ ...userCredential.user, displayName });
    }
    const firestoreUser = await saveUserToFirestore(userCredential.user, displayName);
    return { ...userCredential, firestoreUser };
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
      const firestoreUser = await saveUserToFirestore(userCredential.user, userCredential.user.displayName);
      return { ...userCredential, firestoreUser };
    });
  }

  async function loginWithGoogle() {
    console.log("loginWithGoogle initiated");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("signInWithPopup succeeded", result.user);
      
      // Always ensure the user exists in Firestore (fixes issue for users created before Firestore was added)
      console.log("Checking/Saving user to Firestore...");
      const firestoreUser = await saveUserToFirestore(result.user, result.user.displayName);
      console.log("Saved user to Firestore successfully");
      
      return { ...result, firestoreUser };
    } catch (error) {
      console.error("Error in loginWithGoogle:", error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await saveUserToFirestore(currentUser, currentUser.displayName);
        } catch (error) {
          console.error("Error ensuring user document exists:", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    register,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loader fullScreen /> : children}
    </AuthContext.Provider>
  );
}
