const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get('/', (req, res) => {
  res.json({ message: 'ChainStock Auth API is running' });
});

app.use('/api/auth', authRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ChainStock backend running on port ${PORT}`);
});
