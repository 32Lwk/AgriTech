// Test setup file
// This file runs before all tests

// Set test database URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./test.db";
}
