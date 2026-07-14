const { MongoClient } = require('mongodb');

async function fix() {
    const c = new MongoClient('mongodb://127.0.0.1:27017');
    await c.connect();
    const db = c.db('reviewlens');

    console.log("Updating businesses review_counts...");
    const counts = await db.collection('reviews').aggregate([{ $group: { _id: '$business_id', count: { $sum: 1 } } }]).toArray();
    let updatedCount = 0;
    for (const rc of counts) {
        await db.collection('businesses').updateOne({ business_id: rc._id }, { $set: { review_count: rc.count } });
        updatedCount++;
    }
    console.log(`Updated ${updatedCount} businesses with their review count.`);

    console.log("Updating users review_counts (if needed)...");
    const userCounts = await db.collection('reviews').aggregate([{ $group: { _id: '$user_id', count: { $sum: 1 } } }]).toArray();
    let updatedUserCount = 0;
    for (const uc of userCounts) {
        await db.collection('users').updateOne({ user_id: uc._id }, { $set: { review_count: uc.count } });
        updatedUserCount++;
    }
    console.log(`Updated ${updatedUserCount} users with their review count.`);

    await c.close();
}

fix().catch(console.error);
