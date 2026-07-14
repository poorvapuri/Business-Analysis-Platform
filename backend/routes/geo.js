const express = require('express');
const { query } = require('../db/postgres');
const router = express.Router();

// Helper to generate Haversine distance condition in SQL (meters to km)
function haversineCondition(latParam, lngParam, radiusParam) {
  const earthRadiusKm = 6371;
  return `(${earthRadiusKm} * acos(
    cos(radians($${latParam})) * cos(radians(latitude)) *
    cos(radians(longitude) - radians($${lngParam})) +
    sin(radians($${latParam})) * sin(radians(latitude))
  )) <= ($${radiusParam} / 1000)`;
}

// GET /api/geo/nearby?lat=&lng=&radius=&category=&minStars=
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, category, minStars } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required parameters" });
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseInt(radius, 10);

    const conditions = [];
    const params = [];
    // Distance condition
    conditions.push(haversineCondition(1, 2, 3));
    params.push(latNum, lngNum, radiusNum);

    if (category) {
      conditions.push(`categories::text ILIKE $${params.length + 1}`);
      params.push(`%${category}%`);
    }
    if (minStars) {
      conditions.push(`stars >= $${params.length + 1}`);
      params.push(parseFloat(minStars));
    }

    const sql = `SELECT * FROM businesses WHERE ${conditions.join(' AND ')} LIMIT 50;`;
    const result = await query(sql, params);
    res.json({ data: result.rows, queryExecuted: sql });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/geo/cities – aggregated city statistics
router.get('/cities', async (req, res) => {
  try {
    const sql = `
      SELECT city,
             COUNT(*) AS "businessCount",
             AVG(stars) AS "averageStars"
      FROM businesses
      GROUP BY city
      ORDER BY "businessCount" DESC
      LIMIT 20;
    `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
