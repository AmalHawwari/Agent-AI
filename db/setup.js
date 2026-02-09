// Database Setup File
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create database
const dbPath = path.join(dbDir, 'library.db');

// Try to delete old database
try {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('Old database deleted');
    }
} catch (err) {
    console.log('Could not delete old database (may be in use). Creating tables...');
}

const db = new Database(dbPath);

// Drop old tables
db.exec('DROP TABLE IF EXISTS tool_calls');
db.exec('DROP TABLE IF EXISTS messages');
db.exec('DROP TABLE IF EXISTS order_items');
db.exec('DROP TABLE IF EXISTS orders');
db.exec('DROP TABLE IF EXISTS customers');
db.exec('DROP TABLE IF EXISTS books');

// Read and execute schema.sql
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);
console.log('Tables created successfully!');

// Read and execute seed.sql
const seedPath = path.join(__dirname, 'seed.sql');
const seed = fs.readFileSync(seedPath, 'utf8');
db.exec(seed);
console.log('Initial data loaded successfully!');

// Close connection
db.close();

console.log('\n✅ Database setup completed!');
console.log('📁 Database location:', dbPath);
