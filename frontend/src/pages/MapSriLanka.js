const MapSriLanka = ({ carrierFilter, setCarrierFilter }) => {
  const mapRef = useRef(null);
  const [apiKey, setApiKey] = useState("");
  const [map, setMap] = useState(null);
  const [locations, setLocations] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [openDetails, setOpenDetails] = useState(false);

  // Fetch API key from backend
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setApiKey(data.googleMapsApiKey));
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!apiKey) return;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => {
      if (window.google) {
        const m = new window.google.maps.Map(mapRef.current, {
          center: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka
          zoom: 7,
        });
        setMap(m);
      }
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, [apiKey]);

  // Fetch locations from backend BASED ON carrierFilter (server-side filtering)
  useEffect(() => {
    if (!map) return;
    const loadLocations = async () => {
      try {
        const res = await fetch(
          `/api/locations?carrier=${encodeURIComponent(carrierFilter)}`
        );
        if (!res.ok) throw new Error("Failed to fetch locations");
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadLocations();
  }, [map, carrierFilter]);

  // Map color dots for sidebar
  const colorHexByCarrier = (carrier) => {
    switch (carrier) {
      case "Dialog":
        return "#FFD600"; // yellow
      case "Mobitel":
        return "#BDBDBD"; // grey
      case "Hutch":
        return "#43A047"; // green
      case "Etisalat":
        return "#2196F3"; // blue
      default:
        return "#F44336"; // red
    }
  };

  // Place markers whenever locations change
  useEffect(() => {
    if (!map) return;

    // Clear old markers
    markers.forEach((marker) => marker.setMap(null));

    const newMarkers = locations
      .map((loc) => {
        const lat = loc.coordinates?.latitude;
        const lng = loc.coordinates?.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        // Decide marker icon URL
        let iconUrl;
        if (carrierFilter === "All") {
          // Use relevant color per customer name
          const name = (loc.customer || loc.CUSR_NAME || "").toLowerCase();
          if (name.includes("dialog"))
            iconUrl = carrierIcons.Dialog;
          else if (name.includes("mobitel"))
            iconUrl = carrierIcons.Mobitel;
          else if (name.includes("hutch"))
            iconUrl = carrierIcons.Hutch;
          else if (name.includes("etisalat"))
            iconUrl = carrierIcons.Etisalat;
          else
            iconUrl = carrierIcons.Other;
        } else {
          // Single color for the selected carrier
          iconUrl = carrierIcons[carrierFilter] || carrierIcons.Other;
        }

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: loc.cct || "Unknown",
          animation: window.google.maps.Animation.DROP,
          icon: { url: iconUrl },
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
      <Box
        ref={mapRef}
        sx={{ flex: 2, borderRadius: 2, overflow: "hidden" }}
      />

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
            
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={() => setOpenDetails(true)}
          sx={{ mb: 2 }}
        >
          View Alarm Location Details
        </Button>

        {/* Location list */}
        <Typography variant="h6" gutterBottom>
          Locations
        </Typography>
        {locations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No locations found
          </Typography>
        ) : (
          locations.map((loc, i) => {
            const name = (loc.customer || loc.CUSR_NAME || "").toLowerCase();
            const perCarrier =
              carrierFilter === "All"
                ? name.includes("dialog")
                  ? "Dialog"
                  : name.includes("mobitel")
                  ? "Mobitel"
                  : name.includes("hutch")
                  ? "Hutch"
                  : name.includes("etisalat")
                  ? "Etisalat"
                  : "Other"
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
