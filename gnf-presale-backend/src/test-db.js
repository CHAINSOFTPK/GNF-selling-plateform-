const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:12345678@45.150.32.16:27017/admin';

async function testConnection() {
    try {
        console.log('Attempting to connect to:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB!');
        const dbs = await mongoose.connection.db.admin().listDatabases();
        console.log('Available databases:', dbs);
    } catch (error) {
        console.error('Connection error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

testConnection();