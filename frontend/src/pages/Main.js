import React from "react";
import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EventNoteIcon from "@mui/icons-material/EventNote";

// =====================
// Background & Overlay
// =====================
const VideoBackground = styled("video")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "70%",
  objectFit: "cover",
  zIndex: -1,
});

// Darker overlay for readability (0.8)
const Overlay = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(47, 47, 47, 0.8)",
  zIndex: 0,
});

// ===============
// Page Structure
// ===============
const PageContainer = styled(Box)({
  minHeight: "100vh",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  textAlign: "center",
  color: "#fff",
});

const HighlightText = styled("span")({
  color: "#FFD700",
  fontWeight: "bold",
});

// ==================
// Services (Cards)
// ==================
// Uses your requested paddings & radii
const ServicesSection = styled(Box)({
  position: "relative",
  padding: "3px 25px",
  zIndex: 1,
  marginTop: 16,
  display: "flex",            // Add flex display
  flexDirection: "column",    // Stack vertically
  alignItems: "center",       // Center horizontally
});

const CustomCard = styled(Card)({
  textAlign: "center",
  padding: "1px",
  borderRadius: "12px",
  background: "#f8f8f8",
  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)",
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-10px)",
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.3)",
  },
});

const IconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "4rem",
  color: "#007BFF",
  marginBottom: "10px",
});

// ==============
// Map Section
// ==============
const MapSection = styled(Box)({
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-start", // Align map to the left
  alignItems: "flex-start",
  width: "100%",                // Use full width
  marginTop: "200px",            // Reduce top margin for better spacing
  minHeight: "600px",
  zIndex: 1,
  padding: "0",                 // Remove horizontal padding
});

const MapContainer = styled(Box)({
  width: "2500px", // your requested fixed size
  maxWidth: "100%", // responsive safety on small screens
  height: "800px",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
  display: "block",
  overflow: "hidden",
});

const RightSide = styled(Box)({
  minWidth: "300px",
  height: "600px",
  marginLeft: "32px",
  background: "#f8f8f8",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  padding: "24px",
});

// ==================
// Main Component
// ==================
const Main = ({ MapComponent, RightComponent }) => {
  const services = [
    {
      title: "Inventory Management",
      description:
        "Track all your household items in one place, stay updated on stock levels and expiry dates.",
      icon: <InventoryIcon fontSize="large" sx={{ color: "#007BFF" }} />,
    },
    {
      title: "Smart Grocery Lists",
      description:
        "Generate grocery lists automatically based on low-stock items and meal plans.",
      icon: <ShoppingCartIcon fontSize="large" sx={{ color: "#007BFF" }} />,
    },
    {
      title: "Personalized Planning",
      description:
        "Create AI-powered schedules for meals, shopping, and tasks based on your preferences.",
      icon: <EventNoteIcon fontSize="large" sx={{ color: "#007BFF" }} />,
    },
  ];

  return (
    <PageContainer>
      {/* Video background */}
      <VideoBackground autoPlay loop muted playsInline>
        <source src="/videos/v2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </VideoBackground>
      <Overlay />

      {/* Welcome / Hero */}
      <Box position="relative" zIndex={1} sx={{ padding: "100px 20px 0 20px" }}>
        <Typography variant="h3" fontWeight="bold">
          Welcome to <HighlightText>SLT Mobitel Alarm System</HighlightText>
        </Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Real-Time Visibility. Rapid Resolution.
        </Typography>
      </Box>

      {/* Services Cards */}
      <ServicesSection sx={{ marginTop: 10 }}>
        <Box sx={{ maxWidth: 1400, width: "100%" }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ mb: 2, textAlign: "center", color: "#fff" }}
          >
            Our Services
          </Typography>

          <Grid container spacing={2} justifyContent="center">
            {services.map((s, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <CustomCard>
                  <CardContent>
                    <IconWrapper>{s.icon}</IconWrapper>
                    <Typography variant="h6" gutterBottom>
                      {s.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.description}
                    </Typography>
                  </CardContent>
                </CustomCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </ServicesSection>

      {/* Map Section (separate block, not vertically centered with hero) */}
      <MapSection>
        <MapContainer>
          {MapComponent ? (
            <MapComponent />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" color="primary">
                [Map will be displayed here]
              </Typography>
            </Box>
          )}
        </MapContainer>

        {RightComponent && (
          <RightSide>
            <RightComponent />
          </RightSide>
        )}
      </MapSection>
    </PageContainer>
  );
};

export default Main;
