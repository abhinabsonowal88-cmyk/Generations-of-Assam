src/lib/auth-context.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "./firebase";
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);
  const requireAuth = () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Authentication is not configured yet. Please add your Firebase keys.");
    return auth;
  };
  const value: AuthContextValue = {
    user,
    loading,
    configured: isFirebaseConfigured,
    signIn: async (email, password) => {
await signInWithEmailAndPassword(requireAuth(), email, password);
    },
    signUp: async (email, password, displayName) => {
      const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
    },
    signInGoogle: async () => {
      await signInWithPopup(requireAuth(), googleProvider);
    },
    logout: async () => {
      await signOut(requireAuth());
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}