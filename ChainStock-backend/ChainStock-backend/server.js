const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

connectDB();

const app = express();

// ── CORS: allow requests from localhost web, emulator, and any LAN device ──
app.use(cors({
  origin: [
    'http://localhost:8081',   // Expo web
    'http://localhost:19006',  // Expo web alternate port
    'http://localhost:3000',   // any local frontend
    'http://10.0.2.2:8081',    // Android emulator
    /^http:\/\/192\.168\./,    // any LAN IP
    /^http:\/\/172\./,         // Docker/WSL IP range
    /^exp:\/\//,               // Expo Go
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'ChainStock Auth API is running' });
});

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ChainStock backend running on port ${PORT}`);
});
