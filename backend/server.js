const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const Location = require("./models/Location.js");

const app = express();
const PORT = process.env.PORT || 8070;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ✅ Validate environment variables
if (!process.env.MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not set in .env file!");
  process.exit(1);
}

if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn("⚠️ WARNING: GOOGLE_MAPS_API_KEY is not set. Google Maps features will not work.");
}

// ✅ MongoDB connection with Mongoose
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas successfully"))
  .catch((err) => {
    console.error("❌ Failed to connect MongoDB:", err);
    process.exit(1);
  });

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("📡 MongoDB connection is open!");
});

// ✅ Import teammates' routes
const testRouter5 = require("./routes/login/test5.js");
const testRouter = require("./routes/test/rtest.js");

app.use("/test5", testRouter5);
app.use("/test", testRouter);

// ---------------- 🌍 Location APIs ----------------


const COLLECTION_NAME = process.env.COLLECTION_NAME || "CEA_LEA";

// Get all locations from the new collection
app.get("/api/locations", async (req, res) => {
  try {
    const carrier = req.query.carrier;
    const rawDocs = await mongoose.connection.db
      .collection(COLLECTION_NAME)
      .find({})
      .toArray();

    const locations = rawDocs
      .map((doc) => {
        const rawLat =
          doc["CEA Node- latitude"] ??
          doc["CEA Node - latitude"] ??
          doc.latitude;
        const rawLng =
          doc["CEA Node- longitude"] ??
          doc["CEA Node - longitude"] ??
          doc.longitude;

        const lat =
          typeof rawLat === "number"
            ? rawLat
            : parseFloat(rawLat || "NaN");
        const lng =
          typeof rawLng === "number"
            ? rawLng
            : parseFloat(rawLng || "NaN");

        // Carrier detection from CUSR_NAME
        let detectedCarrier = "";
        const cusrName = (doc.CUSR_NAME || "").toLowerCase();
        if (cusrName.includes("dialog")) detectedCarrier = "Dialog";
        else if (cusrName.includes("mobitel")) detectedCarrier = "Mobitel";
        else if (cusrName.includes("etisalat")) detectedCarrier = "Etisalat";
        else if (cusrName.includes("hutch")) detectedCarrier = "Hutch";
        else detectedCarrier = "Other";

        return {
          _id: doc._id,
          cct: doc.CCT ?? "",
          service: doc.SERVICE ?? "",
          customer: doc.CUSR_NAME ?? "",
          address: doc.BENDADDRESS ?? "",
          status: doc.CIRT_STATUS ?? "",
          coordinates: { latitude: lat, longitude: lng },
          carrier: detectedCarrier,
        };
      })
      .filter(
        (d) =>
          Number.isFinite(d.coordinates.latitude) &&
          Number.isFinite(d.coordinates.longitude) &&
          (!carrier || carrier === "All" || d.carrier === carrier)
      );

    res.json(locations);
  } catch (error) {
    console.error("❌ Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// (Optional) Delete a location by ID
app.delete("/api/locations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await mongoose.connection.db
      .collection(COLLECTION_NAME)
      .deleteOne({ _id: new mongoose.Types.ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting location:", error);
    res.status(500).json({ error: "Failed to delete location" });
  }
});


// ---------------- ⚡ Utility APIs ----------------

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Serve Google Maps API key to frontend
app.get("/api/config", (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
  });
});

// ---------------- 🚀 Start Server ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});








// const express = require('express');
// const { MongoClient } = require('mongodb');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 8070;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// // Validate environment variables
// if (!process.env.MONGODB_URI) {
//   console.error('ERROR: MONGODB_URI environment variable is not set!');
//   console.error('Please create a .env file with your MongoDB Atlas connection string.');
//   process.exit(1);
// }

// if (!process.env.GOOGLE_MAPS_API_KEY) {
//   console.error('WARNING: GOOGLE_MAPS_API_KEY environment variable is not set!');
//   console.error('Google Maps functionality will not work without this key.');
// }

// // MongoDB connection
// let db;
// let isConnected = false;

// async function connectToMongoDB() {
//   try {
//     const client = await MongoClient.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
    
//     db = client.db();
//     isConnected = true;
//     console.log('✅ Connected to MongoDB Atlas successfully');
    
//     // Handle connection close
//     client.on('close', () => {
//       console.log('❌ MongoDB connection closed');
//       isConnected = false;
//     });
    
//     client.on('error', (error) => {
//       console.error('❌ MongoDB connection error:', error);
//       isConnected = false;
//     });
    
//   } catch (error) {
//     console.error('❌ Failed to connect to MongoDB Atlas:', error);
//     console.error('Please check your connection string and network connection.');
//     process.exit(1);
//   }
// }

// // Initialize MongoDB connection
// connectToMongoDB();

// // Middleware to check database connection
// function checkDatabaseConnection(req, res, next) {
//   if (!isConnected) {
//     return res.status(503).json({ 
//       error: 'Database connection not available. Please try again later.' 
//     });
//   }
//   next();
// }

// // API Routes
// app.get('/api/locations', checkDatabaseConnection, async (req, res) => {
//   try {
//     const locations = await db.collection('locations').find({}).toArray();
//     res.json(locations);
//   } catch (error) {
//     console.error('Error fetching locations:', error);
//     res.status(500).json({ error: 'Failed to fetch locations from database' });
//   }
// });

// // Add a new location
// app.post('/api/locations', checkDatabaseConnection, async (req, res) => {
//   try {
//     const { name, latitude, longitude, description } = req.body;
    
//     console.log('Received location data:', { name, latitude, longitude, description });
    
//     // Input validation
//     if (!name || !latitude || !longitude) {
//       return res.status(400).json({ 
//         error: 'Name, latitude, and longitude are required' 
//       });
//     }
    
//     // Validate coordinate ranges
//     const lat = parseFloat(latitude);
//     const lng = parseFloat(longitude);
    
//     if (isNaN(lat) || isNaN(lng)) {
//       return res.status(400).json({ 
//         error: 'Invalid coordinates. Please provide valid numbers.' 
//       });
//     }
    
//     if (lat < -90 || lat > 90) {
//       return res.status(400).json({ 
//         error: 'Latitude must be between -90 and 90 degrees.' 
//       });
//     }
    
//     if (lng < -180 || lng > 180) {
//       return res.status(400).json({ 
//         error: 'Longitude must be between -180 and 180 degrees.' 
//       });
//     }
    
//     const newLocation = {
//       name: name.trim(),
//       coordinates: {
//         latitude: lat,
//         longitude: lng
//       },
//       description: description ? description.trim() : '',
//       createdAt: new Date()
//     };
    
//     console.log('Attempting to save location:', newLocation);
//     console.log('Database name:', db.databaseName);
//     console.log('Collection name: locations');
    
//     const result = await db.collection('locations').insertOne(newLocation);
//     console.log('Location saved successfully with ID:', result.insertedId);
    
//     res.json({ 
//       success: true, 
//       id: result.insertedId,
//       location: newLocation
//     });
    
//   } catch (error) {
//     console.error('Error adding location:', error);
//     res.status(500).json({ error: 'Failed to add location to database: ' + error.message });
//   }
// });

// // Delete a location
// app.delete('/api/locations/:id', checkDatabaseConnection, async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     if (!id) {
//       return res.status(400).json({ error: 'Location ID is required' });
//     }
    
//     console.log('Attempting to delete location with ID:', id);
    
//     // Convert string ID to ObjectId if needed
//     let objectId;
//     try {
//       const { ObjectId } = require('mongodb');
//       objectId = new ObjectId(id);
//     } catch (error) {
//       return res.status(400).json({ error: 'Invalid location ID format' });
//     }
    
//     const result = await db.collection('locations').deleteOne({ _id: objectId });
    
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ error: 'Location not found' });
//     }
    
//     console.log('Location deleted successfully');
//     res.json({ success: true, message: 'Location deleted successfully' });
    
//   } catch (error) {
//     console.error('Error deleting location:', error);
//     res.status(500).json({ error: 'Failed to delete location: ' + error.message });
//   }
// });

// // Get database info for debugging
// app.get('/api/debug', checkDatabaseConnection, async (req, res) => {
//   try {
//     const collections = await db.listCollections().toArray();
//     const locationCount = await db.collection('locations').countDocuments();
    
//     res.json({
//       database: db.databaseName,
//       collections: collections.map(c => c.name),
//       locationsCount: locationCount,
//       connectionStatus: isConnected
//     });
//   } catch (error) {
//     console.error('Error getting debug info:', error);
//     res.status(500).json({ error: 'Failed to get debug info' });
//   }
// });

// // Serve Google Maps API key to frontend
// app.get('/api/config', (req, res) => {
//   res.json({ 
//     googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
//     hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY
//   });
// });

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'ok',
//     database: isConnected ? 'connected' : 'disconnected',
//     timestamp: new Date().toISOString()
//   });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
// });


