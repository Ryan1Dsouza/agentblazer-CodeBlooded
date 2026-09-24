interface GoogleUser {
  email: string | null;
  emailVerified: boolean;
  providerData: ReadonlyArray<{ providerId: string }>;
}

export const COLLEGE_ACCOUNT_ERROR = 'Please choose your verified college Google account ending in @sjec.ac.in.';

export function isCollegeGoogleUser(user: GoogleUser): boolean {
  return user.emailVerified
    && /^[^@\s]+@sjec\.ac\.in$/i.test(user.email ?? '')
    && user.providerData.some(({ providerId }) => providerId === 'google.com');
}

export function getCollegeDisplayName(email: string): string {
  const localPart = email.split('@')[0];
  const name = localPart.split('.').filter(Boolean).pop() || localPart;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

  switch (code) {
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Google sign-in is not enabled for this site yet. Please contact the AgentBlazer team.';
    case 'auth/unauthorized-domain':
      return 'Google sign-in is not configured for this website address. Please contact the AgentBlazer team.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site, then try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled. Try again and choose your college account.';
    case 'auth/network-request-failed':
      return 'Could not connect to Google sign-in. Check your connection and try again.';
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
      return 'Sign-in is unavailable because of a site configuration error. Please contact the AgentBlazer team.';
    case 'auth/web-storage-unsupported':
      return 'Your browser is blocking sign-in storage. Allow site data for this site and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact the AgentBlazer team.';
    default:
      return 'Could not sign in with Google. Please try again.';
  }
}
