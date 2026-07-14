// backend/db.js
// Deprecated MongoDB helper – now a shim that directs developers to the PostgreSQL layer.

// This file intentionally does NOT establish a database connection.
// Importing this module will throw an informative error to guide migration.

function _deprecated() {
  throw new Error(
    'MongoDB connection has been removed. Use the PostgreSQL helper at "backend/db/postgres.js" instead.'
  );
}

module.exports = {
  // Preserve the original exported names so existing imports do not break at runtime,
  // but they now throw to indicate the migration path.
  connectToDatabase: _deprecated,
  getDb: _deprecated
};
