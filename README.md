# Pluriverse Project — installable PWA package

This folder is a ready-to-deploy Progressive Web App: `index.html`, `manifest.json`,
`sw.js` (service worker), an `icons/` folder, and an `images/` folder (public Home
page photos/figures).

The app works two ways automatically, from the same file:
- **Inside Claude** (opened as this artifact): uses Claude's built-in shared storage. No setup needed.
- **Deployed on its own domain**: uses **Firebase** (Firestore + Authentication + Storage).

## 1. Create a free Firebase project

1. https://console.firebase.google.com/ → **Add project**.
2. **Build → Firestore Database → Create database** → Start in production mode → pick a region.
3. **Build → Authentication → Get started → Sign-in method → enable Anonymous.**
   This lets the app sign visitors in quietly, with no login screen — it's how
   Firestore/Storage know a request is coming from the app, not a random script.
4. Gear icon → **Project settings → General → Your apps → Web (`</>`)** → register
   an app → copy the `firebaseConfig` object shown.

## 2. Paste the config into index.html

Open `index.html`, search for `FIREBASE_CONFIG` (near the top of the main
`<script>` block), and replace the placeholder values with your real ones.

Also search for `SITE_PASSWORD` and replace `'CHANGE_ME'` with your team's real
shared password (the login the "Team Login" button on the public site asks for).

## 3. Set Firestore security rules

**Build → Firestore Database → Rules**, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pluriverse_data/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

## 4. Enable Storage and set its rules (needed for blog PDF uploads)

Storage is a *separate* Firebase service from Firestore — it's specifically for
files (PDFs, images), not data records.

1. **Build → Storage → Get started** → choose **Start in production mode** → pick a
   region (same one as Firestore is simplest) → Done.
2. **Storage → Rules**, replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish**. Same model as the Firestore rule — anyone who's loaded the app
(and so has an anonymous sign-in) can read and write; this matches how the rest of
the site already works (anyone with the link can edit).

Without this step, everything else works fine — the PDF upload field on blog posts
will just show as disabled with a note that Storage isn't set up yet.

## 5. Deploy the files

**GitHub Pages:** create a repo, upload every file in this folder (keeping the
folder structure — `icons/`, `images/` need to stay as folders, not get flattened)
→ repo Settings → Pages → Deploy from branch → root.

**Netlify Drop:** https://app.netlify.com/drop — drag the whole folder in, get a
live URL immediately.

Custom domain (optional): point your domain's DNS at GitHub Pages —
four A records (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) for the bare
domain, and a CNAME for `www` pointing at `yourusername.github.io`. If using
Cloudflare for DNS, set those specific records to "DNS only" (gray cloud), not
proxied, to avoid HTTPS certificate conflicts with GitHub.

## 6. Install it

- **Android (Chrome):** open the URL → menu → "Install app" (or a banner appears automatically).
- **iOS (Safari):** open the URL → Share icon → "Add to Home Screen".
- **Desktop (Chrome/Edge):** install icon appears in the address bar.

## How updates work going forward

Just replace `index.html` on GitHub when you get a new version from Claude — the
service worker is set up to always fetch the latest HTML rather than getting stuck
on an old cached copy. You only need to re-upload `sw.js`, `manifest.json`, `icons/`,
or `images/` when those specifically change (Claude will tell you when that's the case).

## Notes

- The Claude-hosted version and the deployed version have **separate data** —
  they're different databases and don't sync with each other.
- Free Firebase tier (Spark plan) limits: Firestore ~50K reads/20K writes per day;
  Storage 5GB stored / 1GB downloaded per day — comfortably enough for a small
  research team site, PDFs included.
- The password gate is a soft deterrent, not real security — anyone who inspects
  the page source can see the real password. It keeps casual visitors and search
  engines out; it does not stop a determined person from reaching internal data.
