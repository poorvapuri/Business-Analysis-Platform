// backend/scripts/importYelp.js
// PostgreSQL import script for ReviewLens using pg helper and batch inserts

const fs = require('fs');
const readline = require('readline');
const path = require('path');
require('dotenv').config();
const { batchInsert, query } = require('../db/postgres');

// Configuration – can be overridden via .env
const DATA_DIR = process.env.YELP_DATA_DIR || 'C:\\Users\\DELL\\Downloads\\archive (30)';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10) || 1000;
const BUSINESS_LIMIT = parseInt(process.env.BUSINESS_LIMIT, 10) || Infinity;
const USER_LIMIT = parseInt(process.env.USER_LIMIT, 10) || Infinity;
const REVIEW_LIMIT = parseInt(process.env.REVIEW_LIMIT, 10) || Infinity;

let businessCount = 0;
let userCount = 0;
let reviewCount = 0;

// In‑memory map for denormalising city and business name in reviews
const businessMap = new Map();

/**
 * Helper for businesses upsert – updates newly added columns on conflict
 */
async function upsertBusinesses(rows) {
  if (!rows.length) return;
  const cols = ['business_id', 'name', 'address', 'city', 'state', 'postal_code', 'latitude', 'longitude', 'stars', 'review_count', 'categories', 'hours'];
  const columnList = cols.map(c => `"${c}"`).join(', ');
  const valuePlaceholders = rows.map((_, i) => {
    const offset = i * cols.length;
    const placeholders = cols.map((__, j) => `$${offset + j + 1}`).join(', ');
    return `(${placeholders})`;
  }).join(', ');
  const flatValues = rows.flat();
  const setClause = cols.slice(1).map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');
  const sql = `INSERT INTO "businesses" (${columnList}) VALUES ${valuePlaceholders}
               ON CONFLICT (business_id) DO UPDATE SET ${setClause};`;
  await query(sql, flatValues);
}

/**
 * Generic line‑by‑line file processor.
 * @param {string} filePath Absolute path to the JSON lines file.
 * @param {function(Object):Array|null} transformFn Converts a parsed JSON object to a row array matching the target table columns.
 * @param {string} tableName Target PostgreSQL table name.
 * @param {Array<string>} columns Ordered list of column names for the target table.
 * @param {number} limit Optional maximum number of rows to process for this collection.
 */
async function processFile(filePath, transformFn, tableName, columns, limit) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}, skipping...`);
    return;
  }
  console.log(`Processing ${tableName} from ${filePath}...`);
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let batch = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (limit && ((tableName === 'businesses' && businessCount >= limit) ||
      (tableName === 'users' && userCount >= limit) ||
      (tableName === 'reviews' && reviewCount >= limit))) {
      break;
    }
    try {
      const data = JSON.parse(line);
      const row = transformFn(data);
      if (row) {
        batch.push(row);
        if (tableName === 'businesses') businessCount++;
        else if (tableName === 'users') userCount++;
        else reviewCount++;
      }
    } catch (e) {
      console.error(`Error parsing line in ${filePath}:`, e.message);
    }

    if (batch.length >= BATCH_SIZE) {
      if (tableName === 'businesses') {
        await upsertBusinesses(batch);
      } else {
        await batchInsert(tableName, columns, batch);
      }
      console.log(`${tableName}: inserted ${batch.length} rows (total ${tableName === 'businesses' ? businessCount : tableName === 'users' ? userCount : reviewCount})`);
      batch = [];
    }
  }
  if (batch.length) {
    if (tableName === 'businesses') {
      await upsertBusinesses(batch);
    } else {
      await batchInsert(tableName, columns, batch);
    }
    console.log(`${tableName}: inserted final ${batch.length} rows`);
  }
}

async function importBusinesses() {
  const cols = ['business_id', 'name', 'address', 'city', 'state', 'postal_code', 'latitude', 'longitude', 'stars', 'review_count', 'categories', 'hours'];
  await processFile(
    path.join(DATA_DIR, 'yelp_academic_dataset_business.json'),
    data => {
      const row = [
        data.business_id,
        data.name,
        data.address,
        data.city,
        data.state,
        data.postal_code,
        data.latitude,
        data.longitude,
        data.stars,
        data.review_count,
        data.categories ? data.categories.split(',').map(c => c.trim()) : null,
        data.hours ? data.hours : null
      ];
      businessMap.set(data.business_id, { city: data.city, name: data.name });
      return row;
    },
    'businesses',
    cols,
    BUSINESS_LIMIT
  );
}

async function importUsers() {
  const cols = ['user_id', 'name', 'review_count', 'average_stars', 'fans'];
  await processFile(
    path.join(DATA_DIR, 'yelp_academic_dataset_user.json'),
    data => [
      data.user_id,
      data.name,
      data.review_count,
      data.average_stars,
      data.fans
    ],
    'users',
    cols,
    USER_LIMIT
  );
}

async function importReviews() {
  const cols = ['review_id', 'user_id', 'business_id', 'stars', 'text', 'review_date', 'city', 'business_name', 'search_vector'];
  await processFile(
    path.join(DATA_DIR, 'yelp_academic_dataset_review.json'),
    data => {
      const bInfo = businessMap.get(data.business_id) || { city: null, name: null };
      return [
        data.review_id,
        data.user_id,
        data.business_id,
        data.stars,
        data.text,
        new Date(data.date),
        bInfo.city,
        bInfo.name,
        null
      ];
    },
    'reviews',
    cols,
    REVIEW_LIMIT
  );
}

async function runImport() {
  try {
    await importBusinesses();
    console.log(`Businesses imported: ${businessCount}`);
    await importUsers();
    console.log(`Users imported: ${userCount}`);
    await importReviews();
    console.log(`Reviews imported: ${reviewCount}`);
    console.log('Import completed successfully!');
  } catch (e) {
    console.error('Import failed:', e);
  } finally {
    const { pool } = require('../db/postgres');
    await pool.end();
  }
}

// Uncomment the line below to run the import.
// runImport();

console.log('Import script ready. To execute the real dataset import, uncomment runImport() in this file and run it.');
