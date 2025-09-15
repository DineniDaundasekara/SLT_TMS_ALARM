import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

// Helper: detect carrier name
function getCarrierByCustomerName(customerName) {
  if (!customerName) return "Other";
  const raw = String(customerName).toLowerCase();
  const name = raw.replace(/\s|-/g, "");
  if (name.includes("dialog")) return "Dialog";
  if (name.includes("sltmobitel") || name.includes("mobitel")) return "Mobitel";
  if (name.includes("hutchison") || name.includes("hutch")) return "Hutch";
  if (name.includes("etisalat")) return "Etisalat";
  return "Other";
}

// Carrier colors (unified)
const colorHexByCarrier = () => "#2f4f4f";

const MapSriLanka = () => {
  const mapRef = useRef(null);
  const [apiKey, setApiKey] = useState("");
  const [map, setMap] = useState(null);
  const [locations, setLocations] = useState([]);
  const [openDetails, setOpenDetails] = useState(false);

  // ✅ Get API key
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setApiKey(data.googleMapsApiKey));
  }, []);

  // ✅ Load Google Maps script
  useEffect(() => {
    if (!apiKey) return;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => {
      if (window.google) {
        const m = new window.google.maps.Map(mapRef.current, {
          center: { lat: 7.8731, lng: 80.7718 },
          zoom: 7,
        });
        setMap(m);
      }
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, [apiKey]);

  // ✅ Load locations within map bounds
  useEffect(() => {
    if (!map) return;

    const loadLocations = async () => {
      try {
        const bounds = map.getBounds();
        if (!bounds) return;

        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();

        const query = new URLSearchParams({
          north: northEast.lat(),
          south: southWest.lat(),
          east: northEast.lng(),
          west: southWest.lng(),
        });

        const res = await fetch(`/api/locations?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch locations");
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error("Error loading locations:", err);
      }
    };

    // Initial load
    loadLocations();

    // Reload when map moves
    const listener = map.addListener("idle", loadLocations);
    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
  }, [map]);

  // ✅ Place individual markers (no clustering)
  useEffect(() => {
    if (!map || locations.length === 0) return;

    // Clear existing markers
    map.markers?.forEach((m) => m.setMap(null));
    map.markers = [];

    locations.forEach((loc) => {
      // LEA marker
      if (
        Number.isFinite(loc.leaCoordinates?.latitude) &&
        Number.isFinite(loc.leaCoordinates?.longitude)
      ) {
        const fillColor = colorHexByCarrier(loc.carrier);
        const leaMarker = new window.google.maps.Marker({
          position: {
            lat: loc.leaCoordinates.latitude,
            lng: loc.leaCoordinates.longitude,
          },
          map,
          title: `LEA - ${loc.cct || "Unknown"}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding:10px;">
              <p><b>LEA Location</b></p>
              <p><b>CCT:</b> ${loc.cct || "-"}</p>
              <p><b>Service:</b> ${loc.service || "-"}</p>
              <p><b>Customer:</b> ${loc.customer || "-"}</p>
              <p><b>Address:</b> ${loc.address || "-"}</p>
              <p><b>Status:</b> ${loc.status || "-"}</p>
            </div>
          `,
        });
        leaMarker.addListener("click", () => infoWindow.open(map, leaMarker));
        map.markers.push(leaMarker);
      }

      // CCT marker
      if (
        Number.isFinite(loc.cctCoordinates?.latitude) &&
        Number.isFinite(loc.cctCoordinates?.longitude)
      ) {
        const cctMarker = new window.google.maps.Marker({
          position: {
            lat: loc.cctCoordinates.latitude,
            lng: loc.cctCoordinates.longitude,
          },
          map,
          title: `CCT - ${loc.cct || "Unknown"}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#800080", // purple
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding:10px;">
              <p><b>CCT Location</b></p>
              <p><b>CCT:</b> ${loc.cct || "-"}</p>
              <p><b>Service:</b> ${loc.service || "-"}</p>
              <p><b>Customer:</b> ${loc.customer || "-"}</p>
              <p><b>Address:</b> ${loc.address || "-"}</p>
              <p><b>Status:</b> ${loc.status || "-"}</p>
            </div>
          `,
        });
        cctMarker.addListener("click", () => infoWindow.open(map, cctMarker));
        map.markers.push(cctMarker);
      }
    });
  }, [map, locations]);

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* Map */}
      <Box ref={mapRef} sx={{ flex: 2, borderRadius: 2, overflow: "hidden" }} />

      {/* Sidebar */}
      <Box
        sx={{
          flex: 1,
          ml: 2,
          bgcolor: "white",
          borderRadius: 2,
          p: 2,
          boxShadow: 1,
          overflowY: "auto",
        }}
      >
        {/* Filter removed as all carriers use same color */}

        <Button
          variant="contained"
          onClick={() => setOpenDetails(true)}
          sx={{ mb: 2 }}
        >
          View Alarm Location Details
        </Button>

        <Typography variant="h6" gutterBottom>
          Locations in View: {locations.length}
        </Typography>

        {locations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No locations found in this area
          </Typography>
        ) : (
          locations.map((loc, i) => (
            <Box
              key={loc._id || i}
              sx={{
                p: 1.5,
                mb: 1.5,
                border: "1px solid #ddd",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: colorHexByCarrier(loc.carrier),
                  mr: 1.5,
                  border: "1px solid #ccc",
                }}
              />
              <Box>
                <Typography variant="subtitle1">
                  {loc.cct} - {loc.service}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {loc.customer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {loc.address}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status: {loc.status}
                </Typography>
              </Box>
            </Box>
          ))
        )}

        <Dialog
          open={openDetails}
          onClose={() => setOpenDetails(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>All Location Details</DialogTitle>
          <DialogContent>
            {locations.map((loc, index) => (
              <Box
                key={index}
                sx={{ mb: 2, p: 1, border: "1px solid #ddd", borderRadius: 1 }}
              >
                <Typography variant="h6">{loc.cct}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Service: {loc.service}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customer: {loc.customer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Address: {loc.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {loc.status}
                </Typography>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetails(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MapSriLanka;
