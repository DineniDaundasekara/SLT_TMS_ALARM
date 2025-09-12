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

// Get all locations from the new collection, with carrier filter
app.get("/api/locations", async (req, res) => {
  try {
    const carrier = req.query.carrier;
    const { north, south, east, west } = req.query;

    const collection = mongoose.connection.db.collection(COLLECTION_NAME);

    // Build query
    const query = {};

    // ✅ Filter by map bounds if provided
    if (north && south && east && west) {
      query.$or = [
        {
          "CEA Node- latitude": { $gte: parseFloat(south), $lte: parseFloat(north) },
          "CEA Node- longitude": { $gte: parseFloat(west), $lte: parseFloat(east) },
        },
        {
          latitude: { $gte: parseFloat(south), $lte: parseFloat(north) },
          longitude: { $gte: parseFloat(west), $lte: parseFloat(east) },
        },
      ];
    }

    const rawDocs = await collection.find(query).toArray();

    const locations = rawDocs
      .map((doc) => {
        // Carrier detection
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
          leaCoordinates: {
            latitude: parseFloat(doc["CEA Node- latitude"]),
            longitude: parseFloat(doc["CEA Node- longitude"]),
          },
          cctCoordinates: {
            latitude: parseFloat(doc.latitude),
            longitude: parseFloat(doc.longitude),
          },
          carrier: detectedCarrier,
        };
      })
      .filter((d) => {
        const hasLea =
          Number.isFinite(d.leaCoordinates?.latitude) &&
          Number.isFinite(d.leaCoordinates?.longitude);
        const hasCct =
          Number.isFinite(d.cctCoordinates?.latitude) &&
          Number.isFinite(d.cctCoordinates?.longitude);

        return (hasLea || hasCct) && (!carrier || carrier === "All" || d.carrier === carrier);
      });

    res.json(locations);
  } catch (error) {
    console.error("❌ Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
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
