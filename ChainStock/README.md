# ChainStock

An AI-powered crypto & stock market app built with React Native (Expo).

- Live crypto prices via **CoinGecko** (no key needed)
- Live stock prices via **Alpha Vantage** (free key)
- AI BUY/SELL/HOLD predictions via **Anthropic Claude**
- Historical market events timeline
- Full email/password authentication backed by a Node/Express/MongoDB API with JWT

---

## 1. Project Structure

```
ChainStock/                  # Expo React Native app
├── App.js
├── app.json
├── babel.config.js
├── tsconfig.json
├── package.json
└── src/
    ├── constants/
    │   ├── theme.js          # Colors, spacing, fonts
    │   └── data.js            # Asset lists & historical events
    ├── services/
    │   ├── marketService.js   # CoinGecko + Alpha Vantage
    │   ├── aiService.js       # Anthropic Claude predictions
    │   └── authService.js     # Talks to the backend auth API
    ├── context/
    │   └── AuthContext.js     # Auth state, auto-login/logout
    ├── navigation/
    │   └── AppNavigator.js    # Auth stack + main tabs
    ├── components/
    │   ├── index.js                 # AssetRow, SectionCard, Tag
    │   └── PredictionYearSlider.tsx # 1-10 year prediction slider
    └── screens/
        ├── WelcomeScreen.js
        ├── MarketsScreen.js
        ├── DetailScreen.js
        ├── PredictionsScreen.js
        ├── HistoryScreen.js
        ├── PortfolioScreen.js
        ├── LoginScreen.js
        └── RegisterScreen.js

ChainStock-backend/           # Node/Express/MongoDB auth API
├── server.js
├── package.json
├── .env.example
├── config/db.js
├── models/User.js
├── controllers/authController.js
├── middleware/authMiddleware.js
├── middleware/errorMiddleware.js
├── routes/authRoutes.js
└── utils/generateToken.js
```

---

## 2. Backend Setup (Authentication API)

### 2.1 Install dependencies

```bash
cd ChainStock-backend
npm install
```

### 2.2 Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/chainstock
JWT_SECRET=replace_this_with_a_long_random_secret_string
JWT_EXPIRES_IN=30d
```

- For `MONGO_URI`, you can run MongoDB locally, or use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended for testing on a physical phone).
- Generate a strong `JWT_SECRET`, e.g. with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

### 2.3 Run the backend

```bash
npm run dev    # with nodemon (auto-restarts)
# or
npm start
```

You should see:
```
MongoDB connected: ...
ChainStock backend running on port 5000
```

### 2.4 API Endpoints

| Method | Endpoint              | Auth required | Body                              |
|--------|-----------------------|----------------|-----------------------------------|
| POST   | `/api/auth/register`  | No             | `{ name, email, password }`       |
| POST   | `/api/auth/login`     | No             | `{ email, password }`             |
| GET    | `/api/auth/me`        | Yes (Bearer)   | -                                  |
| POST   | `/api/auth/logout`    | Yes (Bearer)   | -                                  |

**Logout note:** JWTs are stateless, so there is no server-side session to destroy. `/api/auth/logout` simply confirms the request; the actual logout happens on the client by deleting the stored token from `AsyncStorage` (handled automatically by `authService.logout()`).

---

## 3. Frontend (Expo App) Setup

### 3.1 Install prerequisites

```bash
npm install -g expo-cli
cd ChainStock
npm install
```

### 3.2 Point the app at your backend

Open `src/services/authService.js` and update:

```js
const API_BASE_URL = 'http://localhost:5000/api/auth';
```

- **iOS Simulator**: `http://localhost:5000/api/auth` works.
- **Android Emulator**: use `http://10.0.2.2:5000/api/auth`.
- **Physical device (Expo Go)**: use your computer's LAN IP, e.g. `http://192.168.1.50:5000/api/auth`. Your phone and computer must be on the same Wi-Fi network.

### 3.3 Add your API keys

**Anthropic (AI predictions)** — open `src/services/aiService.js`:
```js
const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
```
Get a key at https://console.anthropic.com

**Alpha Vantage (live stock prices)** — open `src/services/marketService.js`:
```js
const ALPHA_VANTAGE_API_KEY = 'YOUR_ALPHA_VANTAGE_KEY_HERE';
```
Get a free key at https://www.alphavantage.co/support/#api-key

> ⚠️ **Security note:** Hardcoding API keys in a mobile app means anyone who installs it can extract them. This is fine for local development and demos. For a real production app, move the Anthropic/Alpha Vantage calls behind your own backend (e.g. add routes to `ChainStock-backend`) so keys never ship inside the app bundle.

CoinGecko (crypto prices) requires **no API key** on the free tier.

### 3.4 Run the app

```bash
npx expo start
```

Then:
- Press `i` → iOS Simulator (Mac only)
- Press `a` → Android Emulator
- Press `w` → Web browser
- Scan the QR code with the **Expo Go** app on your phone

---

## 4. Authentication Flow

1. On launch, the app checks `AsyncStorage` for a saved JWT.
2. If found, it calls `GET /api/auth/me` to validate the token.
   - **Valid** → user is auto-logged-in and lands on the Welcome screen → main tabs.
   - **Invalid/expired** → token is cleared and the user sees the Login screen.
3. **Register**: `RegisterScreen` → `POST /api/auth/register` → token stored → main app.
4. **Login**: `LoginScreen` → `POST /api/auth/login` → token stored → main app.
5. **Logout**: tap "Logout" on the Home tab → token removed from `AsyncStorage` → back to Login.

---

## 5. App Screens

| Screen      | Description |
|-------------|-------------|
| Welcome     | Intro screen with feature highlights (gradient hero) |
| Home (Markets) | Live crypto (CoinGecko) + stock (Alpha Vantage) prices, search, auto-refresh every 30s |
| Detail      | Asset price, 24h change, 30-day line chart, "Get AI Prediction" button |
| Predictions | Pick an asset + prediction horizon (1-10 years via slider), get a Claude-generated BUY/SELL/HOLD signal with confidence, support/resistance and catalysts |
| History     | Searchable/filterable timeline of major market events |
| Portfolio   | Placeholder portfolio screen with onboarding steps |
| Login/Register | Email/password auth, validation, password visibility toggle |

---

## 6. Building for Production

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
eas build -p ios
```

---

## 7. Disclaimer

ChainStock is for educational and informational purposes only. AI predictions are **not financial advice**. Always do your own research before investing.
