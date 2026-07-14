require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db/postgres');

const analyticsRoutes = require('./routes/analytics');
const businessesRoutes = require('./routes/businesses');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');
const geoRoutes = require('./routes/geo');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/businesses', businessesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/geo', geoRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

async function startServer() {
    try {
        // Verify PostgreSQL connection
        await pool.query('SELECT 1');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to connect to DB and start server:', err);
        process.exit(1);
    }
}

startServer();
