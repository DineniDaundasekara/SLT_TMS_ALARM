import React, { useState } from "react";
import Main from "./Main";
import Footer from "./Footer";
import UNavbar from "./UNavbar";
import { Box } from "@mui/material";
import MapSriLanka from "./MapSriLanka";

// ----------------- Main Home Component -----------------
const Home = () => {
  const [carrierFilter, setCarrierFilter] = useState("All");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <UNavbar />
      <Box sx={{ flex: 1 }}>
        <Main
          MapComponent={() => (
            <MapSriLanka
              carrierFilter={carrierFilter}
              setCarrierFilter={setCarrierFilter}
            />
          )}
        />
      </Box>
      <Footer />
    </Box>
  );
};

export default Home;
