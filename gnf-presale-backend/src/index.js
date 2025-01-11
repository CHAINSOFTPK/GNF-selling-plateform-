const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const referralRoutes = require('./routes/referralRoutes');
const transferRoutes = require('./routes/transferRoutes');
const twitterRoutes = require('./routes/twitterRoutes');
const socialVerificationRoutes = require('./routes/socialVerificationRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Add this line

const app = express();

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : [];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));

app.use(express.json());
app.use(morgan('dev'));

// Add detailed logging middleware
app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request Body:', req.body);

    const originalJson = res.json;
    res.json = function(data) {
        console.log('Response:', data);
        return originalJson.call(this, data);
    };
    
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/twitter', twitterRoutes);
app.use('/api/social', socialVerificationRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/admin', adminRoutes); // Add this line

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
