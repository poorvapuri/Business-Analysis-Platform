const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

// GET /api/users/top-influencers?city=&limit=
// Ranks users by formula: (useful * 3) + (funny * 1) + (review_count * 0.5)
// using $lookup, $addFields, and $sort
router.get('/top-influencers', async (req, res) => {
    try {
        const { city, limit = 10 } = req.query;
        const limitNum = parseInt(limit, 10);
        const db = getDb();
        const users = db.collection('users');

        let pipeline = [];

        // If a city is provided, we want to only rank users who have reviewed in that city.
        // Doing a $lookup of reviews from the users collection is expensive on the full Yelp dataset.
        // A better approach in production is to start from reviews if city is filtered. But to adhere
        // to demonstrating $lookup, we will proceed as requested:
        
        if (city) {
            pipeline.push({
                $lookup: {
                    from: 'reviews',
                    localField: 'user_id',
                    foreignField: 'user_id',
                    as: 'city_reviews'
                }
            });
            pipeline.push({
                $match: { 'city_reviews.city': new RegExp(`^${city}$`, 'i') }
            });
            // We only need the lookup to filter, we can strip it out to save memory
            pipeline.push({ $project: { city_reviews: 0 } });
        }

        // Add the computed score field
        pipeline.push({
            $addFields: {
                influenceScore: {
                    $add: [
                        { $multiply: ["$useful", 3] },
                        { $multiply: ["$funny", 1] },
                        { $multiply: ["$review_count", 0.5] }
                    ]
                }
            }
        });

        pipeline.push({ $sort: { influenceScore: -1 } });
        pipeline.push({ $limit: limitNum });

        const topUsers = await users.aggregate(pipeline).toArray();
        res.json(topUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id
// Demonstrates Update Operator ($rename) to rename the legacy `name` field to `full_name`
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { full_name, renameNameToFullName, ...otherFields } = req.body;

        const db = getDb();
        const users = db.collection('users');
        const updateOps = {};

        if (Object.keys(otherFields).length > 0) {
            updateOps.$set = otherFields;
        }
        if (full_name !== undefined) {
            updateOps.$set = { ...(updateOps.$set || {}), full_name };
        }
        if (renameNameToFullName) {
            updateOps.$rename = { name: 'full_name' };
        }

        if (Object.keys(updateOps).length === 0) {
            return res.status(400).json({ error: 'No update instructions provided' });
        }

        const result = await users.updateOne({ user_id: userId }, updateOps);
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully', updateOperations: updateOps });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
