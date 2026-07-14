const express = require('express');
const { query } = require('../db/postgres');
const router = express.Router();

// GET /api/businesses?city=&category=&minStars=&minReviews=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { city, category, minStars, minReviews, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    const whereClauses = [];

    if (city) {
      params.push(city);
      whereClauses.push(`city ILIKE $${params.length}`);
    }
    if (minStars) {
      params.push(parseFloat(minStars));
      whereClauses.push(`stars >= $${params.length}`);
    }
    if (minReviews) {
      params.push(parseInt(minReviews, 10));
      whereClauses.push(`review_count >= $${params.length}`);
    }
    if (category) {
      const cats = category.split(',').map(c => c.trim()).filter(c => c);
      if (cats.length === 1) {
        params.push(cats[0]);
        whereClauses.push(`$${params.length} = ANY (categories)`);
      } else if (cats.length > 1) {
        const arrayLiteral = `{${cats.join(',')}}`;
        params.push(arrayLiteral);
        whereClauses.push(`categories @> $${params.length}::text[]`);
      }
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const dataSql = `SELECT * FROM businesses ${where} ORDER BY stars DESC, review_count DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);
    const { rows } = await query(dataSql, params);

    const countSql = `SELECT COUNT(*) FROM businesses ${where}`;
    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await query(countSql, countParams);
    const totalCount = parseInt(countRows[0].count, 10);

    res.json({ data: rows, total: totalCount, page: pageNum, pages: Math.ceil(totalCount / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/businesses/open/today – uses JSONB hours column
router.get('/open/today', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit, 10);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const sql = `SELECT * FROM businesses WHERE hours ? $1 LIMIT $2`;
    const { rows } = await query(sql, [today, limitNum]);
    res.json({ dayChecked: today, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/businesses/:id
router.get('/:id', async (req, res) => {
  try {
    const sql = `SELECT * FROM businesses WHERE business_id = $1`;
    const { rows } = await query(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Business not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/businesses/:id/reviews – pagination + user enrichment
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const revSql = `SELECT * FROM reviews WHERE business_id = $1 ORDER BY review_date DESC LIMIT $2 OFFSET $3`;
    const { rows: reviews } = await query(revSql, [req.params.id, limitNum, offset]);

    const userIds = reviews.map(r => r.user_id);
    let usersMap = {};
    if (userIds.length) {
      const userSql = `SELECT * FROM users WHERE user_id = ANY($1)`;
      const { rows: users } = await query(userSql, [userIds]);
      usersMap = Object.fromEntries(users.map(u => [u.user_id, u]));
    }
    const enriched = reviews.map(r => ({ ...r, user: usersMap[r.user_id] || null }));

    const cntSql = `SELECT COUNT(*) FROM reviews WHERE business_id = $1`;
    const { rows: cntRows } = await query(cntSql, [req.params.id]);
    const totalCount = parseInt(cntRows[0].count, 10);

    res.json({ data: enriched, total: totalCount, page: pageNum, pages: Math.ceil(totalCount / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
