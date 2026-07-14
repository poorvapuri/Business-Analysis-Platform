const express = require('express');
const { pool } = require('../db/postgres');
const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
    try {
        const [businessCountRes, reviewCountRes, userCountRes, avgStarsRes] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM businesses'),
            pool.query('SELECT COUNT(*) FROM reviews'),
            pool.query('SELECT COUNT(*) FROM users'),
            pool.query('SELECT AVG(stars) AS avg_stars FROM businesses')
        ]);
        const businessCount = parseInt(businessCountRes.rows[0].count, 10);
        const reviewCount = parseInt(reviewCountRes.rows[0].count, 10);
        const userCount = parseInt(userCountRes.rows[0].count, 10);
        const avgStars = avgStarsRes.rows[0].avg_stars || 0;

        res.json({
            businesses: businessCount,
            reviews: reviewCount,
            users: userCount,
            averageStars: Number(avgStars)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/trending?days=90
router.get('/trending', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 90;
        // Determine the latest review_date to act as 'now'
        const nowRes = await pool.query('SELECT MAX(review_date) AS max_date FROM reviews');
        const now = nowRes.rows[0].max_date ? new Date(nowRes.rows[0].max_date) : new Date();
        const recentDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        const priorDate = new Date(recentDate.getTime() - (days * 24 * 60 * 60 * 1000));
        const sql = `
            SELECT business_id, business_name,
                   SUM(CASE WHEN review_date >= $1 THEN 1 ELSE 0 END) AS recent_count,
                   SUM(CASE WHEN review_date < $1 THEN 1 ELSE 0 END) AS prior_count,
                   (SUM(CASE WHEN review_date >= $1 THEN 1 ELSE 0 END) -
                    SUM(CASE WHEN review_date < $1 THEN 1 ELSE 0 END)) AS growth
            FROM reviews
            WHERE review_date >= $2 AND review_date <= $3
            GROUP BY business_id, business_name
        `;
        const { rows } = await pool.query(sql, [recentDate, priorDate, now]);
        const topTrending = rows
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 10)
            .map(r => ({ business_id: r.business_id, business_name: r.business_name, growth: Number(r.growth) }));
        const topDeclining = rows
            .sort((a, b) => a.growth - b.growth)
            .slice(0, 10)
            .map(r => ({ business_id: r.business_id, business_name: r.business_name, growth: Number(r.growth) }));
        res.json({ topTrending, topDeclining });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/category-breakdown?city=
router.get('/category-breakdown', async (req, res) => {
    try {
        const city = req.query.city;
        const params = [];
        let cityFilter = '';
        if (city) {
            params.push(city);
            cityFilter = 'WHERE LOWER(city) = LOWER($1)';
        }
        const sql = `
            SELECT UNNEST(categories) AS category,
                   COUNT(*) AS businessCount,
                   AVG(stars) AS averageStars,
                   SUM(review_count) AS totalReviews
            FROM businesses
            ${cityFilter}
            GROUP BY category
            ORDER BY businessCount DESC
            LIMIT 15
        `;
        const { rows } = await pool.query(sql, params);
        // Map PostgreSQL lowercase keys to camelCase and cast numeric strings to numbers
        const formatted = rows.map(r => ({
          category: r.category,
          businessCount: Number(r.businesscount),
          averageStars: Number(r.averagestars),
          totalReviews: Number(r.totalreviews)
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/stars-distribution?city=
router.get('/stars-distribution', async (req, res) => {
    try {
        const city = req.query.city;
        const params = [];
        let cityFilter = '';
        if (city) {
            params.push(city);
            cityFilter = 'WHERE LOWER(city) = LOWER($1)';
        }
        const sql = `
            SELECT CASE
                WHEN stars >= 5 THEN '5'
                ELSE CONCAT(FLOOR(stars)::text, '-', (FLOOR(stars) + 0.9)::text)
            END AS stars,
            COUNT(*) AS count,
            AVG(review_count) AS averageReviews
            FROM businesses
            ${cityFilter}
            GROUP BY stars
            ORDER BY stars
        `;
        const { rows } = await pool.query(sql, params);
        // Cast counts and averages to numbers, keep keys camelCase
        const formatted = rows.map(r => ({
          stars: r.stars,
          count: Number(r.count),
          averageReviews: Number(r.averagereviews)
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/monthly-volume?months=12
router.get('/monthly-volume', async (req, res) => {
    try {
        const monthsStr = req.query.months || 12;
        let months = parseInt(monthsStr);
        if (isNaN(months)) months = 12;
        const nowRes = await pool.query('SELECT MAX(review_date) AS max_date FROM reviews');
        const now = nowRes.rows[0].max_date ? new Date(nowRes.rows[0].max_date) : new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        const sql = `
            SELECT DATE_TRUNC('month', review_date) AS month,
                   COUNT(*) AS reviewCount,
                   AVG(stars) AS averageStars
            FROM reviews
            WHERE review_date >= $1
            GROUP BY month
            ORDER BY month ASC
        `;
        const { rows } = await pool.query(sql, [startDate]);
        const formatted = rows.map(r => ({
            month: new Date(r.month).toLocaleString('default', { month: 'short', year: '2-digit' }),
            reviewCount: Number(r.reviewcount),
            averageStars: Number(r.averagestars)
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
