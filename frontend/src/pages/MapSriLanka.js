import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, FormControl, InputLabel, Card, CardContent, CardHeader, Chip, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

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
const colorHexByCarrier = (carrier) => {
  if (carrier === "Mobitel") return "#00008B"; // light blue
  if (carrier === "Hutch") return "#8B4000";   // light green
  if (carrier === "Dialog") return "#9400D3";  // light orange
  return "#2f4f4f";
};

const CARRIER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Dialog", value: "Dialog" },
  { label: "Mobitel", value: "Mobitel" },
  { label: "Hutch", value: "Hutch" },
  { label: "Etisalat", value: "Etisalat" },
  { label: "Other", value: "Other" },
];

// Customer Data Card Component
const CustomerDataCard = ({ data, onClose }) => {
  if (!data) return null;

  const getStatusColor = (status) => {
    if (!status) return "default";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("online")) return "success";
    if (statusLower.includes("inactive") || statusLower.includes("offline")) return "error";
    if (statusLower.includes("pending") || statusLower.includes("waiting")) return "warning";
    return "default";
  };

  return (
    <Card 
      sx={{ 
        position: 'fixed', 
        top: 20, 
        left: 20, 
        width: 350, 
        zIndex: 1000,
        boxShadow: 3,
        borderRadius: 2
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              CCT Details
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            CCT ID
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            {data.cct || "N/A"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Customer
          </Typography>
          <Typography variant="body1">
            {data.customer || "N/A"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Service
          </Typography>
          <Typography variant="body1">
            {data.service || "N/A"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Address
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {data.address || "N/A"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Status
          </Typography>
          <Chip 
            label={data.status || "N/A"} 
            color={getStatusColor(data.status)}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Carrier
          </Typography>
          <Chip 
            label={data.carrier || "Other"} 
            sx={{ 
              backgroundColor: colorHexByCarrier(data.carrier),
              color: 'white',
              fontWeight: 'bold'
            }}
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const MapSriLanka = () => {
  const mapRef = useRef(null);
  const [apiKey, setApiKey] = useState("");
  const [map, setMap] = useState(null);
  const [locations, setLocations] = useState([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [selectedCctData, setSelectedCctData] = useState(null);
  const [showCctCard, setShowCctCard] = useState(false);
  const [showConnections, setShowConnections] = useState(true);

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

  // ✅ Load locations within map bounds and carrier
  useEffect(() => {
    if (!map) return;
    // 🚫 Do not load any data until a carrier is selected
    if (!selectedCarrier) {
      setLocations([]);
      // Optionally, clear markers from map
      if (map.markers) {
        map.markers.forEach((m) => m.setMap(null));
        map.markers = [];
      }
      return;
    }

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

        let url = "/api/locations";
        if (selectedCarrier && selectedCarrier !== "") {
          url += "/" + selectedCarrier.toLowerCase();
        }

        const res = await fetch(`${url}?${query.toString()}`);
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
  }, [map, selectedCarrier]);

  // ✅ Place individual markers and connection lines
  useEffect(() => {
    if (!map || locations.length === 0) return;

    // Clear existing markers and polylines
    map.markers?.forEach((m) => m.setMap(null));
    map.markers = [];
    
    if (map.polylines) {
      map.polylines.forEach((p) => p.setMap(null));
      map.polylines = [];
    } else {
      map.polylines = [];
    }

    // Group locations by CEA coordinates to connect CCTs to their CEA
    const ceaGroups = new Map();
    
    locations.forEach((loc) => {
      // CEA marker
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
          title: `CEA - ${loc.cct || "Unknown"}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: fillColor,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding:10px;">
              <p><b>CEA Location</b></p>
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

        // Store CEA position for grouping
        const ceaKey = `${loc.leaCoordinates.latitude},${loc.leaCoordinates.longitude}`;
        if (!ceaGroups.has(ceaKey)) {
          ceaGroups.set(ceaKey, {
            ceaPosition: {
              lat: loc.leaCoordinates.latitude,
              lng: loc.leaCoordinates.longitude,
            },
            carrier: loc.carrier,
            ccts: []
          });
        }
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
            fillColor: "#444444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1,
          },
        });

        cctMarker.addListener("click", () => {
          setSelectedCctData(loc);
          setShowCctCard(true);
        });
        map.markers.push(cctMarker);

        // Add CCT to the nearest CEA group
        const ceaKey = `${loc.leaCoordinates.latitude},${loc.leaCoordinates.longitude}`;
        if (ceaGroups.has(ceaKey)) {
          ceaGroups.get(ceaKey).ccts.push({
            position: {
              lat: loc.cctCoordinates.latitude,
              lng: loc.cctCoordinates.longitude,
            },
            cct: loc.cct
          });
        }
      }
    });

    // Draw connection lines if enabled
    if (showConnections) {
      ceaGroups.forEach((group) => {
        group.ccts.forEach((cct) => {
          const polyline = new window.google.maps.Polyline({
            path: [group.ceaPosition, cct.position],
            geodesic: true,
            strokeColor: colorHexByCarrier(group.carrier),
            strokeOpacity: 0.7,
            strokeWeight: 2,
          });
          polyline.setMap(map);
          map.polylines.push(polyline);
        });
      });
    }
  }, [map, locations, showConnections]);

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* Map */}
      <Box ref={mapRef} sx={{ flex: 2, borderRadius: 2, overflow: "hidden" }} />

      {/* Customer Data Card */}
      {showCctCard && (
        <CustomerDataCard 
          data={selectedCctData} 
          onClose={() => setShowCctCard(false)} 
        />
      )}

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
        {/* Carrier Dropdown */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="carrier-select-label">Carrier</InputLabel>
          <Select
            labelId="carrier-select-label"
            value={selectedCarrier}
            label="Carrier"
            onChange={(e) => setSelectedCarrier(e.target.value)}
          >
            {CARRIER_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={() => setOpenDetails(true)}
          sx={{ mb: 2 }}
        >
          View Alarm Location Details
        </Button>

        <Button
          variant={showConnections ? "contained" : "outlined"}
          onClick={() => setShowConnections(!showConnections)}
          sx={{ mb: 2, ml: 1 }}
        >
          {showConnections ? "Hide" : "Show"} Connections
        </Button>

        <Typography variant="h6" gutterBottom>
          Locations in View: {locations.length}
        </Typography>

        {/* Legend */}
        <Box sx={{ mb: 2, p: 2, border: "1px solid #ddd", borderRadius: 1,color:"#444444" }}>
          <Typography variant="subtitle2" gutterBottom>
            Customer Distribution
          </Typography>
          {selectedCarrier ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 ,color:"#444444", }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: colorHexByCarrier(selectedCarrier),
                    mr: 1,
                    border: "2px solid #ffffff",
                  }}
                />
                <Typography variant="caption">CEA Node ({selectedCarrier})</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1,color:"#444444" }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#444444",
                    mr: 1,
                    border: "1px solid #ffffff",
                  }}
                />
                <Typography variant="caption">CCT Location</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1,color:"#444444" }}>
                <Box
                  sx={{
                    width: 20,
                    height: 2,
                    
                    backgroundColor: colorHexByCarrier(selectedCarrier),
                    mr: 1,
                  }}
                />
                <Typography variant="caption">Connection Line</Typography>
              </Box>
            </>
          ) : (
            <>
              {["Dialog", "Mobitel", "Hutch", "Etisalat", "Other"].map((c) => (
                <Box key={c} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: colorHexByCarrier(c),
                      mr: 1,
                      border: "2px solid #ffffff",
                    }}
                  />
                  <Box sx={{ width: 20, height: 2, backgroundColor: colorHexByCarrier(c), mr: 1 }} />
                  <Typography variant="caption">CEA & Line - {c}</Typography>
                </Box>
              ))}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#444444",
                    mr: 1,
                    border: "1px solid #ffffff",
                  }}
                />
                <Typography variant="caption">CCT Location</Typography>
              </Box>
            </>
          )}
        </Box>

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
