require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const billRoutes = require('./routes/bills');

const app = express();

connectDB();

app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors());

app.use(express.json());

app.use('/api/bills', billRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Wedding Billing API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});