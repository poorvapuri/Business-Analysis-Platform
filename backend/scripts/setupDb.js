const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'reviewlens';

async function setup() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected correctly to server');
    const db = client.db(dbName);

    // Drop collections if they exist to start fresh
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.includes('businesses')) await db.collection('businesses').drop();
    if (collectionNames.includes('reviews')) await db.collection('reviews').drop();
    if (collectionNames.includes('users')) await db.collection('users').drop();

    console.log('Dropped existing collections.');

    // Create Collections
    await db.createCollection('businesses');
    await db.createCollection('reviews');
    await db.createCollection('users');
    console.log('Created collections.');

    // Businesses Indexes
    const businesses = db.collection('businesses');
    await businesses.createIndex({ location: '2dsphere' });
    await businesses.createIndex({ name: 'text' });
    await businesses.createIndex({ city: 1 });
    await businesses.createIndex({ business_id: 1 }, { unique: true });
    await businesses.createIndex({ categories: 1 }); // Useful for category filtering

    // Reviews Indexes
    const reviews = db.collection('reviews');
    await reviews.createIndex({ text: 'text' });
    await reviews.createIndex({ city: 1, stars: -1, date: -1 }); // Compound index
    await reviews.createIndex({ business_id: 1 });
    await reviews.createIndex({ user_id: 1 });
    await reviews.createIndex({ date: -1 });

    // Users Indexes
    const users = db.collection('users');
    await users.createIndex({ user_id: 1 }, { unique: true });

    console.log('Created all required indexes successfully.');

    // Verify indexes
    const bIndexes = await businesses.indexes();
    console.log('\nBusinesses Indexes:', bIndexes.map(i => i.name).join(', '));
    const rIndexes = await reviews.indexes();
    console.log('Reviews Indexes:', rIndexes.map(i => i.name).join(', '));

  } catch (err) {
    console.error(err.stack);
  } finally {
    await client.close();
  }
}

setup();
