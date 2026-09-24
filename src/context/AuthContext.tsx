import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
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
    let unsubscribe: (() => void) | undefined;

    let interactionFired = false;

    const initFirebase = () => {
      if (interactionFired || !active) return;
      interactionFired = true;
      Promise.all([
        import('firebase/auth'),
        import('../lib/firebase')
      ]).then(([{ onAuthStateChanged, signOut }, { auth }]) => {
        if (!active) return;
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (!active) return;
          if (currentUser && isCollegeGoogleUser(currentUser)) {
            setUser(currentUser);
            setAuthError('');
          } else {
            setUser(null);
            if (currentUser) {
              setAuthError(COLLEGE_ACCOUNT_ERROR);
              void signOut(auth).catch(() => {
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
      }).catch((err) => {
        console.warn('Failed to load Firebase auth:', err);
        if (active) setIsInitializing(false);
      });
    };

    window.addEventListener('mousemove', initFirebase, { once: true });
    window.addEventListener('scroll', initFirebase, { once: true });
    window.addEventListener('touchstart', initFirebase, { once: true });

    return () => {
      active = false;
      window.removeEventListener('mousemove', initFirebase);
      window.removeEventListener('scroll', initFirebase);
      window.removeEventListener('touchstart', initFirebase);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    if (operationPending.current || isInitializing) return;
    operationPending.current = true;
    setIsPending(true);
    setAuthError('');

    try {
      const [{ signInWithPopup }, { auth, googleProvider }] = await Promise.all([
        import('firebase/auth'),
        import('../lib/firebase')
      ]);
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
      const [{ signOut }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('../lib/firebase')
      ]);
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
