# Google sign-in for AgentBlazer

## Required Firebase setting

The project's Google sign-in endpoint returned `OPERATION_NOT_ALLOWED: The identity provider configuration is not found` during diagnosis. This makes the popup close before Google account selection. Changing React code alone cannot enable the provider.

1. Open https://console.firebase.google.com/project/agentblazer-db/authentication/providers.
2. Add or edit **Google**, enable it, choose a project support email, and save.
3. Under **Authentication > Settings > Authorized domains**, keep `agentblazer-nine.vercel.app` and `localhost`. Both were already authorized during diagnosis. Add any future custom hostname before using it for sign-in.
4. Keep the `VITE_FIREBASE_*` variables configured for the same Firebase project in Vercel. Redeploy after changing build-time environment variables or application code. Enabling the Google provider itself does not require a redeploy.

For local testing, open `http://localhost:5173/community`; `127.0.0.1` was not in the authorized domain list.

## College-only database access

The shared app session accepts a verified Google account whose email ends exactly in `@sjec.ac.in`. It rejects other accounts, signs them out, and keeps both chat interfaces locked. The domain check also runs when restoring a saved session.

The client check controls the interface. Firestore must also enforce the restriction on the server. The included `firestore.rules` restricts reading and creating `chat_messages` to verified college Google sessions. Publish those rules in **Firestore Database > Rules** after reviewing any existing rules for other collections. Preserve unrelated collection rules; remove any broader rule that grants unauthenticated or non-college access to `chat_messages`, since matching allow rules are combined with OR. These rules have not been published by this local change.

These rules govern community messages; `/api/chat` is a separate AI endpoint and is not protected by Firestore rules.

## Verify

- Click **Sign in with Google** in the Hub's **AgentBlazer Chat** tab. Google's account selector should appear.
- Choose a verified college account such as `24g55.ryan@sjec.ac.in`: the chat should unlock and display `Ryan`.
- Sign out, then choose a personal Gmail: both chats should stay locked and ask for a college account.
- Close the popup: the button should become available again so sign-in can be retried.
- Reload while signed in and check that the college session is restored in both chat interfaces.
- Check Firestore access with the published rules before treating the college restriction as enforced on the database.

Local checks: `node --test tests/auth-policy.test.mjs` (Node 22.18+ or Node 24) and `npm run build`.
