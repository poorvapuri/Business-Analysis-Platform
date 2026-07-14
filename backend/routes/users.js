const express = require('express');
const { query } = require('../db/postgres');
const router = express.Router();

// GET /api/users/top-influencers?city=&limit=
// Ranks users by formula: (useful * 3) + (funny * 1) + (review_count * 0.5)
// using $lookup, $addFields, and $sort
router.get('/top-influencers', async (req, res) => {
  try {
    const { city, limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10) || 10;

    // Base SQL selecting required fields and computing influenceScore
    let sql = `SELECT user_id, name, review_count, average_stars, fans,
                (review_count * 0.5 + fans * 2) AS "influenceScore"
                FROM users`;
    const params = [];
    if (city) {
      sql += ` WHERE EXISTS (SELECT 1 FROM reviews WHERE reviews.user_id = users.user_id AND LOWER(reviews.city) = LOWER($${params.length + 1}))`;
      params.push(city);
    }
    sql += ` ORDER BY "influenceScore" DESC LIMIT $${params.length + 1}`;
    params.push(limitNum);

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching top influencers', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id – placeholder for PostgreSQL backend
router.put('/:id', async (req, res) => {
  res.status(501).json({ error: 'Update not implemented for PostgreSQL backend' });
});

module.exports = router;
