# Pluriversal Land Use — installable PWA package

This folder is a ready-to-deploy Progressive Web App: `index.html`, `manifest.json`,
`sw.js` (service worker), and an `icons/` folder.

The app now supports two storage backends automatically:
- **Inside Claude** (opened as this artifact): uses Claude's built-in shared storage. No setup needed.
- **Deployed on its own domain**: uses **Firebase** (Firestore + anonymous auth). Needs the one-time setup below.

It detects which situation it's in automatically — same file works both ways.

## 1. Create a free Firebase project

1. Go to https://console.firebase.google.com/ and click **Add project**. Name it
   anything (e.g. "pluriverse-dashboard"). You can disable Google Analytics — not needed.
2. In the left sidebar: **Build → Firestore Database → Create database**.
   - Choose **Start in production mode** (we'll set custom rules below).
   - Pick any region close to your team.
3. In the left sidebar: **Build → Authentication → Get started**.
   - Under **Sign-in method**, enable **Anonymous**. This lets the app quietly sign
     everyone in without a login screen — it's just how Firestore knows a request
     is coming from the app rather than a random script on the internet.
4. Click the gear icon (top left) → **Project settings** → scroll to **Your apps** →
   click the **Web** icon (`</>`) → give it a nickname (e.g. "dashboard") → **Register app**.
   You'll see a `firebaseConfig` object like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "pluriverse-dashboard.firebaseapp.com",
     projectId: "pluriverse-dashboard",
     storageBucket: "pluriverse-dashboard.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

## 2. Paste the config into index.html

Open `index.html`, search for `FIREBASE_CONFIG` (near the top of the main
`<script>` block), and replace the `PASTE_...` placeholders with your real values
from step 1.4.

## 3. Set Firestore security rules

In the Firebase console: **Build → Firestore Database → Rules**, replace the
contents with:

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

Click **Publish**. This means: anyone who has loaded the app (and so has an
anonymous sign-in) can read and write the shared project data — matching how the
Claude-hosted version already works today (anyone with the link can edit). It
blocks raw, un-authenticated requests hitting your database directly.

## 4. Deploy the files

**Option 1 — GitHub Pages (free, good if your team already uses GitHub)**
1. Create a new repository and upload all files in this folder, keeping the folder
   structure (`index.html`, `manifest.json`, `sw.js`, `icons/*.png` all at matching
   relative paths).
2. Repo → Settings → Pages → Deploy from branch → select your branch and `/ (root)`.
3. You'll get a URL like `https://yourorg.github.io/reponame/`.

**Option 2 — Netlify Drop (fastest)**
1. Go to https://app.netlify.com/drop
2. Drag this whole folder into the browser window.
3. You get a live URL immediately; create a free account to keep it permanent.

**Option 3 — Cloudflare Pages / Vercel**
Similar drag-and-drop or repo-connected deploys, also free.

## 5. Install it

- **Android (Chrome):** open the URL, tap the menu → "Install app" (or a banner
  will usually appear automatically).
- **iOS (Safari):** open the URL, tap the Share icon → "Add to Home Screen".
- **Desktop (Chrome/Edge):** an install icon appears in the address bar; click it.

## Notes

- If you skip the Firebase setup and deploy anyway, the app still loads and works
  visually, but nothing will save — you'll see a one-time toast warning about this
  on load.
- The two versions (Claude artifact vs. deployed PWA) have **separate data** — they
  don't sync with each other, since Claude's storage and Firestore are different
  databases. Decide which one is the "real" version your team uses going forward.
- Free Firebase tier (Spark plan) limits: 50K reads/20K writes per day, 1GiB
  storage — far more than a small research team dashboard will use.
