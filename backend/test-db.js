const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testDatabase() {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in environment variables');
        return;
    }

    console.log('🔍 Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const db = client.db();
        console.log('✅ Connected to MongoDB successfully!');
        console.log('Database name:', db.databaseName);

        // List collections
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Test locations collection
        const locationsCollection = db.collection('locations');
        
        // Count documents
        const count = await locationsCollection.countDocuments();
        console.log('Current locations count:', count);

        // Test insert
        const testLocation = {
            name: 'Test Location',
            coordinates: {
                latitude: 40.7128,
                longitude: -74.0060
            },
            description: 'This is a test location',
            createdAt: new Date()
        };

        console.log('📝 Inserting test location...');
        const result = await locationsCollection.insertOne(testLocation);
        console.log('✅ Test location inserted with ID:', result.insertedId);

        // Verify insert
        const newCount = await locationsCollection.countDocuments();
        console.log('New locations count:', newCount);

        // Find the test location
        const found = await locationsCollection.findOne({ _id: result.insertedId });
        console.log('Found location:', found);

        // Clean up - delete test location
        console.log('🧹 Cleaning up test location...');
        await locationsCollection.deleteOne({ _id: result.insertedId });
        const finalCount = await locationsCollection.countDocuments();
        console.log('Final locations count:', finalCount);

        await client.close();
        console.log('✅ Database test completed successfully!');

    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
}

testDatabase();
