import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { COLLEGE_ACCOUNT_ERROR, getAuthErrorMessage, getCollegeDisplayName, isCollegeGoogleUser } from '../lib/authPolicy';

interface AuthContextValue {
  user: User | null;
  displayName: string;
  authError: string;
  isAuthenticating: boolean;
  handleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const operationPending = useRef(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!active) return;

      // Validate restored sessions and new Google sign-ins before exposing a user to chat.
      if (currentUser && isCollegeGoogleUser(currentUser)) {
        setUser(currentUser);
        setAuthError('');
      } else {
        setUser(null);
        if (currentUser) {
          setAuthError(COLLEGE_ACCOUNT_ERROR);
          void signOut(auth).catch(() => {
            // Keep chat locked even if clearing the rejected Firebase session fails.
            if (active) setAuthError(COLLEGE_ACCOUNT_ERROR);
          });
        }
      }
      setIsInitializing(false);
    }, (error) => {
      if (!active) return;
      setUser(null);
      setAuthError(getAuthErrorMessage(error));
      setIsInitializing(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    if (operationPending.current || isInitializing) return;
    operationPending.current = true;
    setIsPending(true);
    setAuthError('');

    try {
      // Call directly from the click, before any await, to preserve the browser's popup permission.
      // The shared auth observer validates the resulting account before unlocking either chat.
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      operationPending.current = false;
      setIsPending(false);
    }
  };

  const handleSignOut = async () => {
    if (operationPending.current) return;
    operationPending.current = true;
    setIsPending(true);
    setAuthError('');
    try {
      await signOut(auth);
    } catch {
      setAuthError('Could not sign out. Please try again.');
    } finally {
      operationPending.current = false;
      setIsPending(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      displayName: user?.email ? getCollegeDisplayName(user.email) : '',
      authError,
      isAuthenticating: isInitializing || isPending,
      handleSignIn,
      handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
