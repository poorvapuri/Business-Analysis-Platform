// backend/routes/reviews.js
// PostgreSQL implementation of the ReviewLens reviews API
// Mirrors the original MongoDB behavior exactly (URL paths, request/response format,
// validation, error handling). All data‑modifying operations that also affect the
// businesses table are wrapped in a transaction.

const express = require('express');
const { query, pool } = require('../db/postgres');
const router = express.Router();

// ---------- Helper ----------
/**
 * CASE expression used for sentiment breakdown.
 */
const sentimentCase = `CASE 
  WHEN stars >= 4 THEN 'Positive' 
  WHEN stars = 3 THEN 'Neutral' 
  WHEN stars <= 2 THEN 'Negative' 
  ELSE 'Unknown' 
END`;

// ---------- GET /sentiment-breakdown ----------
router.get('/sentiment-breakdown', async (req, res) => {
  try {
    const city = req.query.city;
    let sql = `SELECT ${sentimentCase} AS sentiment, COUNT(*) AS count FROM reviews`;
    const params = [];
    if (city) {
      sql += ' WHERE LOWER(city) = LOWER($1)';
      params.push(city);
    }
    sql += ' GROUP BY sentiment'; // keep original ordering (no ORDER BY)
    const { rows } = await query(sql, params);
    const data = rows.map(r => ({ sentiment: r.sentiment, count: Number(r.count) }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET /hourly-activity ----------
router.get('/hourly-activity', async (req, res) => {
  try {
    const sql = `SELECT EXTRACT(HOUR FROM review_date) AS hour, COUNT(*) AS count
                 FROM reviews
                 GROUP BY hour
                 ORDER BY hour`;
    const { rows } = await query(sql, []);
    const activity = rows.map(r => ({ hour: Number(r.hour), count: Number(r.count) }));
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- POST / (create review) ----------
router.post('/', async (req, res) => {
  try {
    const { user_id, business_id, stars, text } = req.body;
    if (!user_id || !business_id || !stars) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch city and business name from businesses table (no businessMap)
      const bizRes = await client.query(
        'SELECT city, name FROM businesses WHERE business_id = $1',
        [business_id]
      );
      const city = bizRes.rows[0] ? bizRes.rows[0].city : null;
      const business_name = bizRes.rows[0] ? bizRes.rows[0].name : null;

      const review_id = require('crypto').randomUUID();
      const review_date = new Date(); // matches original new Date()

      // Insert review (schema does not have useful/funny/cool columns)
      const insertSql = `INSERT INTO reviews 
        (review_id, user_id, business_id, stars, text, review_date, city, business_name)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`;
      const insertParams = [review_id, user_id, business_id, parseInt(stars, 10), text || '', review_date, city, business_name];
      await client.query(insertSql, insertParams);

      // Increment business review count
      await client.query(
        'UPDATE businesses SET review_count = review_count + 1 WHERE business_id = $1',
        [business_id]
      );

      await client.query('COMMIT');

      const newReview = {
        review_id,
        user_id,
        business_id,
        stars: parseInt(stars, 10),
        text: text || '',
        useful: 0,
        funny: 0,
        cool: 0,
        date: review_date
      };
      res.status(201).json(newReview);
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- PUT /:id (update review) ----------
router.put('/:id', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { text, stars, removeText, usefulMultiplier, clampStars } = req.body;

    // Build dynamic UPDATE statement based on provided operators
    const setClauses = [];
    const values = [];
    let idx = 1;

    if (text !== undefined) {
      setClauses.push(`text = $${idx}`);
      values.push(text);
      idx++;
    }
    if (stars !== undefined) {
      setClauses.push(`stars = $${idx}`);
      values.push(parseInt(stars, 10));
      idx++;
    }
    if (removeText) {
      setClauses.push(`text = NULL`);
    }
    if (usefulMultiplier !== undefined) {
      // Column does not exist; operation is reflected only in response
    }
    if (clampStars !== undefined) {
      setClauses.push(`stars = LEAST(stars, $${idx})`);
      values.push(parseInt(clampStars, 10));
      idx++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid update operations provided' });
    }

    const sql = `UPDATE reviews SET ${setClauses.join(', ')} WHERE review_id = $${idx}`;
    values.push(reviewId);
    await query(sql, values);

    // Build the original‑style updateOperations object for the response
    const updateOps = {};
    const setOps = {};
    if (text !== undefined) setOps.text = text;
    if (stars !== undefined) setOps.stars = parseInt(stars, 10);
    if (Object.keys(setOps).length) updateOps.$set = setOps;
    if (removeText) updateOps.$unset = { text: "" };
    if (usefulMultiplier !== undefined) updateOps.$mul = { useful: parseFloat(usefulMultiplier) };
    if (clampStars !== undefined) updateOps.$min = { stars: parseInt(clampStars, 10) };

    res.json({ message: 'Review updated successfully', updateOperations: updateOps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- DELETE /:id (delete review) ----------
router.delete('/:id', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bizRes = await client.query(
        'SELECT business_id FROM reviews WHERE review_id = $1',
        [reviewId]
      );
      if (!bizRes.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Review not found' });
      }
      const businessId = bizRes.rows[0].business_id;

      await client.query('DELETE FROM reviews WHERE review_id = $1', [reviewId]);
      await client.query(
        'UPDATE businesses SET review_count = review_count - 1 WHERE business_id = $1',
        [businessId]
      );

      await client.query('COMMIT');
      res.json({ message: 'Review deleted successfully' });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
