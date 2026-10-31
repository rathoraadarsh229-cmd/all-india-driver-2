# Google Sign-In Setup (InsForge + Vercel)

The app now uses InsForge's real Google OAuth flow. It does not trust a manually typed Gmail address as proof of identity.

## 1. Enable Google in InsForge

1. Open the InsForge project used by this app (`nuf662tj.ap-southeast.insforge.app`).
2. Open the Authentication / Auth Methods settings and enable the Google provider.
3. Add the Google OAuth Client ID and Client Secret from the Google Cloud OAuth client. Keep the Client Secret only in InsForge's provider settings; never put it in frontend code or a `VITE_` variable.
4. Copy the exact Google callback / redirect URI shown by InsForge for its Google provider.

## 2. Configure Google Cloud

1. In Google Cloud Console, open the same OAuth 2.0 Web Client used above.
2. Add the exact callback URI copied from InsForge to **Authorized redirect URIs**. It is the InsForge backend callback, not the Vercel frontend URL.
3. Add the production website domain to **Authorized JavaScript origins** if the Google console setup screen requests it:
   `https://all-india-driver-app.vercel.app`
4. Save and allow time for provider settings to take effect.

## 3. Allow the Vercel return URL in InsForge

In InsForge Authentication URL / Redirect URL settings, add:

`https://all-india-driver-app.vercel.app/`

For local testing, also add the exact local URL you use (for example `http://localhost:3000/`). Scheme, hostname, port, path and trailing slash must match the configured return URL.

## 4. Deploy

Redeploy the updated project on Vercel. After deployment, open the production domain and choose **Continue with Google**. Google should show its own account chooser. The app will mark the session as authenticated only after InsForge returns a user session.

## Troubleshooting

- `redirect_uri_mismatch`: compare the callback URI configured in Google Cloud with the exact callback URI shown by InsForge.
- `redirect URL not allowed` / redirect validation error: add the exact Vercel return URL above to InsForge's allowed redirect URLs.
- Provider disabled / OAuth not configured: finish the Google provider setup in InsForge Auth Methods.
- Do not paste OAuth Client Secret, API keys, passwords, or service-role keys into chat or frontend code.
