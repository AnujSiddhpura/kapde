# Kapde?

Clickable phone prototype for hostel laundry — student and staff.

**Live preview:** https://anujsiddhpura.github.io/kapde/

Open that link on any phone or laptop with internet. Data stays in that browser (localStorage). Student and staff on the same device share it.

## Run locally

```bash
npm install
npm run dev
```

Open the URL on this computer. On another phone or laptop on the same Wi‑Fi, use the Network address Vite prints (example `http://192.168.1.12:5173`) so Student and Staff share the same live data.

## Cross-device sync

The app stores all accounts, bags, issues, lost-and-found, and announcements on the running server (`/api/state` → `data/store.json`) and polls every second. Anyone using that same running app sees updates.

To put it on the public internet, deploy this project (including the Node server) and open that URL from any device:

```bash
npm run build
npm start
```

Optional Firebase Realtime Database: set `VITE_FIREBASE_DB_URL` (and allow public read/write on `/kapde` for the demo). The client then uses Firebase instead of `/api/state`.
