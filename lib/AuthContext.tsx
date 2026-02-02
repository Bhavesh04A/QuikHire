'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Added 'loading' to the context definition
const AuthContext = createContext<{ 
  user: User | null; 
  role: string | null; 
  loading: boolean 
}>({ 
  user: null, 
  role: null, 
  loading: true 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Default to loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // 1. Set User immediately
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // 2. Fetch Role if user exists
          const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          } else {
            setRole('seeker'); // Default fallback
          }
        } catch (error) {
          console.error("Role Fetch Error:", error);
        }
      } else {
        setRole(null);
      }
      
      // 3. DONE loading
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);