// Database stub module for browser environment
// This file acts as a replacement for Node.js database modules
// that shouldn't be bundled for the browser

// Export empty objects/functions to prevent runtime errors
// when database modules are imported in the browser

// Stub for better-sqlite3
export default class Database {
  constructor() {
    console.warn('better-sqlite3 is a Node.js native module and should not be used in the browser');
  }
  prepare() {
    return {
      get: () => ({}),
      all: () => [],
      run: () => ({})
    };
  }
  exec() {}
  close() {}
}

// Stub for mongodb
export const MongoClient = {
  connect: async () => {
    console.warn('MongoDB is a Node.js module and should not be used in the browser');
    return {
      db: () => ({
        collection: () => ({
          find: () => ({ toArray: async () => [] }),
          insertOne: async () => ({ insertedId: 'stub-id' }),
          updateOne: async () => ({ modifiedCount: 0 }),
          deleteOne: async () => ({ deletedCount: 0 })
        })
      }),
      close: async () => {}
    };
  }
};

// Stub for pg
export const Pool = class Pool {
  constructor() {
    console.warn('pg is a Node.js module and should not be used in the browser');
  }
  connect() {
    return {
      query: async () => ({ rows: [] }),
      release: () => {}
    };
  }
  query() {}
  end() {}
};

// Stub for @neondatabase/serverless
export function neon() {
  console.warn('@neondatabase/serverless is a Node.js module and should not be used in the browser');
  return {
    sql: async () => ({ rows: [] })
  };
}
