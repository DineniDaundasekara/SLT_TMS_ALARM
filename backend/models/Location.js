const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Location", locationSchema);
