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

// Helper function to infer carrier name from customer name
function getCarrierByCustomerName(customerName) {
  if (!customerName) return "Other";
  const raw = String(customerName).toLowerCase();
  const name = raw.replace(/\s|\-/g, ""); // Remove spaces and dashes
  if (name.includes("dialog")) return "Dialog";
  if (name.includes("sltmobitel") || name.includes("mobitel")) return "Mobitel";
  if (name.includes("hutchison") || name.includes("hutch")) return "Hutch";
  if (name.includes("etisalat")) return "Etisalat";
  return "Other";
}

// Main MapSriLanka component
const MapSriLanka = ({ carrierFilter, setCarrierFilter }) => {
  const mapRef = useRef(null); // Reference to the map DOM element
  const [apiKey, setApiKey] = useState(""); // Google Maps API key
  const [map, setMap] = useState(null); // Google Maps instance
  const [locations, setLocations] = useState([]); // All location data
  const [markers, setMarkers] = useState([]); // Google Maps markers
  const [openDetails, setOpenDetails] = useState(false); // Dialog open state

  // Fetch Google Maps API key from backend on mount
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setApiKey(data.googleMapsApiKey));
  }, []);

  // Load Google Maps script and initialize map when API key is available
  useEffect(() => {
    if (!apiKey) return;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => {
      if (window.google) {
        // Create map centered on Sri Lanka
        const m = new window.google.maps.Map(mapRef.current, {
          center: { lat: 7.8731, lng: 80.7718 },
          zoom: 7,
        });
        setMap(m);
      }
    };
    document.body.appendChild(script);
    // Cleanup script on unmount
    return () => document.body.removeChild(script);
  }, [apiKey]);

  // Fetch all locations from backend when map is ready
  useEffect(() => {
    if (!map) return;
    const loadLocations = async () => {
      try {
        const res = await fetch(`/api/locations`);
        if (!res.ok) throw new Error("Failed to fetch locations");
        const data = await res.json();
        setLocations(data); // Store locations in state
      } catch (err) {
        console.error(err);
      }
    };
    loadLocations();
  }, [map]);

  // Filter locations based on selected carrier
  const filteredLocations = locations.filter((loc) => {
    if (carrierFilter === "All") return true;
    const inferred = getCarrierByCustomerName(loc.CUSR_NAME || loc.customer);
    return inferred === carrierFilter;
  });

  // Return color hex code for each carrier
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

  // Place markers on the map for filtered locations
  useEffect(() => {
    if (!map) return;

    // Remove old markers from map
    markers.forEach((marker) => marker.setMap(null));

    // Create new markers for each filtered location
    const newMarkers = filteredLocations
      .map((loc) => {
        const lat = loc.coordinates?.latitude;
        const lng = loc.coordinates?.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        // Determine marker color based on carrier
        const inferred = getCarrierByCustomerName(loc.CUSR_NAME || loc.customer);
        const markerCarrier = carrierFilter === "All" ? inferred : carrierFilter;
        const fill = colorHexByCarrier(markerCarrier);

        // Create Google Maps marker
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: loc.cct || "Unknown",
          animation: window.google.maps.Animation.DROP,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: fill,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1,
          },
        });

        // Info window for marker
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

        // Show info window on marker click
        marker.addListener("click", () => infoWindow.open(map, marker));
        return marker;
      })
      .filter(Boolean); // Remove nulls

    setMarkers(newMarkers); // Update markers state

    // Adjust map bounds to fit all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach((m) => bounds.extend(m.getPosition()));
      map.fitBounds(bounds);
    }
  }, [locations, map, carrierFilter]);

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* Map container */}
      <Box
        ref={mapRef}
        sx={{ flex: 2, borderRadius: 2, overflow: "hidden" }}
      />

      {/* Sidebar with controls and location list */}
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
        {/* Carrier filter dropdown */}
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

        {/* Button to open details dialog */}
        <Button
          variant="contained"
          onClick={() => setOpenDetails(true)}
          sx={{ mb: 2 }}
        >
          View Alarm Location Details
        </Button>

        {/* List of filtered locations */}
        <Typography variant="h6" gutterBottom>
          Locations
        </Typography>
        {filteredLocations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No locations found
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
                {/* Color dot for carrier */}
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

        {/* Quick carrier counts for summary */}
        <Box sx={{ mt: 1, mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Total: {locations.length} | Dialog: {locations.filter(l => getCarrierByCustomerName(l.CUSR_NAME || l.customer) === 'Dialog').length} | Mobitel: {locations.filter(l => getCarrierByCustomerName(l.CUSR_NAME || l.customer) === 'Mobitel').length} | Hutch: {locations.filter(l => getCarrierByCustomerName(l.CUSR_NAME || l.customer) === 'Hutch').length} | Other: {locations.filter(l => getCarrierByCustomerName(l.CUSR_NAME || l.customer) === 'Other').length}
          </Typography>
        </Box>

        {/* Dialog to show all location details */}
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