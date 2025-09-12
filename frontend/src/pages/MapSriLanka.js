import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

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

// Carrier colors
const colorHexByCarrier = (carrier) => {
  switch (carrier) {
    case "Dialog":
      return "#FFD600"; // yellow
    case "Mobitel":
      return "#2196F3"; // blue
    case "Hutch":
      return "#43A047"; // green
    case "Etisalat":
      return "#2196F3"; // blue
    default:
      return "#F44336"; // red
  }
};

const MapSriLanka = ({ carrierFilter, setCarrierFilter }) => {
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
          carrier: carrierFilter,
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
  }, [map]);

  // Filter locations based on dropdown and CUSR_NAME
  const filteredLocations = locations.filter((loc) => {
    if (carrierFilter === "All") return true;
    const inferred = getCarrierByCustomerName(loc.CUSR_NAME || loc.customer);
    return inferred === carrierFilter;
  });

  // Map color dots + marker fill colors
  const colorHexByCarrier = (carrier) => {
    switch (carrier) {
      case "Dialog":
        return "#FFD600"; // yellow
      case "Mobitel":
        return "#2196F3"; // blue
      case "Hutch":
        return "#43A047"; // green
      case "Etisalat":
        return "#2196F3"; // blue
      default:
        return "#F44336"; // red
    }
  };

  // Place markers whenever filteredLocations or filter changes
  useEffect(() => {
    if (!map) return;

    // Clear old markers
    markers.forEach((marker) => marker.setMap(null));

    const newMarkers = filteredLocations
      .map((loc) => {
        const lat = loc.coordinates?.latitude;
        const lng = loc.coordinates?.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        // Decide marker color using vector symbol (no external images)
        const inferred = getCarrierByCustomerName(loc.CUSR_NAME || loc.customer);
        const markerCarrier = carrierFilter === "All" ? inferred : carrierFilter;
        const fill = colorHexByCarrier(markerCarrier);

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: loc.cct || "Unknown",
          animation: window.google.maps.Animation.DROP,
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
              <p><b>CCT:</b> ${loc.cct || "-"}</p>
              <p><b>Service:</b> ${loc.service || "-"}</p>
              <p><b>Customer:</b> ${loc.customer || "-"}</p>
              <p><b>Address:</b> ${loc.address || "-"}</p>
              <p><b>Status:</b> ${loc.status || "-"}</p>
            </div>
          `,
        });

        marker.addListener("click", () => infoWindow.open(map, marker));
        return marker;
      })
      .filter(Boolean);

    setMarkers(newMarkers);

    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach((m) => bounds.extend(m.getPosition()));
      map.fitBounds(bounds);
    }
  }, [locations, map, carrierFilter]);

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
        {/* Carrier Filter */}
        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
          <InputLabel id="carrier-filter-label">Filter by Carrier</InputLabel>
          <Select
            labelId="carrier-filter-label"
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            label="Filter by Carrier"
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Dialog">Dialog</MenuItem>
            <MenuItem value="Mobitel">Mobitel</MenuItem>
            <MenuItem value="Hutch">Hutch</MenuItem>
            <MenuItem value="Etisalat">Etisalat</MenuItem>
            
          </Select>
        </FormControl>

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
          filteredLocations.map((loc, i) => {
            const perCarrier =
              carrierFilter === "All"
                ? getCarrierByCustomerName(loc.CUSR_NAME || loc.customer)
                : carrierFilter;

            return (
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
                {/* Color dot matching marker */}
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: colorHexByCarrier(perCarrier),
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
            );
          })
        )}

        {/* Quick carrier counts (debug/visibility) */}
        <Box sx={{ mt: 1, mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Total: {locations.length} | Dialog: {locations.filter(l => getCarrierByCustomerName(l.CUSR_NAME || l.customer) === 'Dialog').length} | Mobitel: {locations.filter(l => getCarrierByCustomerName(l.CUSR_NAME || l.customer) === 'Mobitel').length} | Hutch: {locations.filter(l => getCarrierByCustomerName(l.CUSR_NAME || l.customer) === 'Hutch').length} | Other: {locations.filter(l => getCarrierByCustomerName(l.CUSR_NAME || l.customer) === 'Other').length}
          </Typography>
        </Box>

        {/* Dialog to View All Location Details */}
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
                sx={{ mb: 2, p: 1, border: "1px solid #c34040ff", borderRadius: 1 }}
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
                <Typography variant="body2" color="text.secondary">
                  BENDADDRESS: {loc.bendAddress || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  EQUP_INDEX: {loc.equpIndex || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  EQ_LOCATION_NODE: {loc.eqLocationNode || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Coordinates: {loc.coordinates?.latitude?.toFixed(6)}, {loc.coordinates?.longitude?.toFixed(6)}
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
