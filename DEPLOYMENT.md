# Free Deployment Guide – Wedding Billing App

Deploy the backend and database for free, then use the mobile app on your phone.

---

## 1. MongoDB Atlas (Free Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a **free cluster** (M0, 512MB).
3. Click **Connect** → **Connect your application** → copy the connection string.
4. Add your database user:
   - Database Access → Add New User → create username/password.
   - Network Access → Add IP Address → allow `0.0.0.0/0` (for cloud hosting).
5. Replace `<password>` in the connection string with your user password.
6. Add database name: `wedding-billing`
   - Example: `mongodb+srv://user:pass@cluster.mongodb.net/wedding-billing?retryWrites=true&w=majority`

---

## 2. Deploy Backend on Render (Free)

1. Go to [render.com](https://render.com) and sign up.
2. **New** → **Blueprint** (recommended) or **Web Service**.
3. Connect your GitHub repo.
4. **If using Blueprint:** Render will read `render.yaml` and pre-fill settings. Just add `MONGODB_URI` in Environment.
5. **If using Web Service manually:** Configure Root Directory `backend`, Build `npm install`, Start `npm start`.
6. **Environment Variables:**
   - `MONGODB_URI` = your Atlas connection string
   - `PORT` = `5000` (Render sets this automatically)
   - `SHOP_NAME`, `SHOP_ADDRESS`, `SHOP_PHONE`, etc. (optional)
7. Deploy. Your API URL will be like: `https://wedding-billing-api.onrender.com`

**Note:** Free tier sleeps after ~15 min of inactivity; first request may take ~30 seconds.

---

## 3. Alternative: Railway (Free Tier)

1. Go to [railway.app](https://railway.app) and sign up.
2. **New Project** → **Deploy from GitHub** (select your repo).
3. Set **Root Directory** to `backend`.
4. Add environment variable `MONGODB_URI`.
5. Deploy. Railway will give you a public URL.

---

## 4. Use Mobile App on Your Phone

### Option A: Expo Go (Quick, no build)

1. Install **Expo Go** from Play Store (Android) or App Store (iOS).
2. In `mobile/src/config/api.js`, set:
   ```javascript
   const DEPLOYED_API_URL = 'https://your-app-name.onrender.com/api';
   ```
3. On your computer:
   ```bash
   cd mobile
   npm start
   ```
4. Scan the QR code with Expo Go (Android) or Camera (iOS).
5. The app will load and use your deployed backend.

### Option B: Standalone APK (Android, install like a normal app)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to Expo:
   ```bash
   eas login
   ```
3. In `mobile/src/config/api.js`, set `DEPLOYED_API_URL` to your backend URL.
4. Build:
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```
5. Download the APK from the link EAS provides and install it on your phone.

---

## 5. Checklist

| Step | Action |
|------|--------|
| 1 | Create MongoDB Atlas cluster and get connection string |
| 2 | Deploy backend to Render (or Railway) with `MONGODB_URI` |
| 3 | Set `DEPLOYED_API_URL` in `mobile/src/config/api.js` |
| 4 | Run `npm start` in mobile folder and scan QR with Expo Go |

---

## 6. Troubleshooting

- **"Cannot connect"** – Check `DEPLOYED_API_URL` and that the backend is running.
- **Render sleep** – First request after sleep can take ~30 seconds.
- **CORS errors** – Backend uses `cors()`; no extra config needed.
- **MongoDB connection failed** – Check Atlas IP whitelist (`0.0.0.0/0`) and credentials.
