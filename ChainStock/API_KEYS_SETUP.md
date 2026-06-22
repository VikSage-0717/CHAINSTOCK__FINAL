# ChainStock — API Keys Setup Guide

## APIs Used (all free, no credit card required)

---

## 1. Twelve Data — Live Stock Prices & Charts
**Free tier:** 800 requests/day · works for US + Indian stocks (AAPL, TCS, RELIANCE etc.)

1. Go to: https://twelvedata.com/register
2. Sign up with email → verify → go to Dashboard
3. Copy your **API Key** from the dashboard
4. Open `src/services/marketService.js`
5. Replace:
   ```js
   export const TWELVE_DATA_API_KEY = 'YOUR_TWELVE_DATA_KEY_HERE';
   ```

---

## 2. NewsData.io — Live Stock News (works on mobile/APK)
**Free tier:** 200 requests/day · works on physical devices

1. Go to: https://newsdata.io/register
2. Sign up → verify email → go to Dashboard → copy API Key
3. Open `src/services/newsService.js`
4. Replace:
   ```js
   const NEWSDATA_API_KEY = 'YOUR_NEWSDATA_KEY_HERE';
   ```
5. Make sure `PROVIDER = 'newsdata'` (already set by default)

> **Alternative (dev only):** If testing on web/emulator you can also use NewsAPI.org (https://newsapi.org/register) and set `PROVIDER = 'newsapi'` — but this won't work on a physical phone/APK.

---

## 3. CoinGecko — Live Crypto Prices
**No API key needed** — free public tier, already configured.

---

## 4. AI Predictions — On-Device LSTM (No API key!)
The prediction model is a **TensorFlow.js LSTM** that trains and runs entirely
on-device using the live price data already fetched. No external API, no cost,
no key required. Just tap "Run LSTM Prediction" in the app.

---

## Quick Summary — Files to Edit

| File | Variable to change |
|------|-------------------|
| `src/services/marketService.js` | `TWELVE_DATA_API_KEY` |
| `src/services/newsService.js` | `NEWSDATA_API_KEY` (and optionally `NEWS_API_KEY`) |
| `src/services/authService.js` | `API_BASE_URL` (point at your backend) |

---

## Install & Run

```powershell
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install

# Fix Expo version alignment
npx expo install --fix
npm install

# Run on Android emulator (start emulator first in Android Studio)
npx expo start -c
# then press 'a'
```

## Build APK

```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```
Download the APK link from the terminal output and install on your phone.
