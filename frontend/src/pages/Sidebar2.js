import React, { useContext } from 'react';
import { List, ListItem, ListItemText, IconButton, Divider, ListItemIcon, Box, Typography } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BuildIcon from '@mui/icons-material/Build';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RepairIcon from '@mui/icons-material/BuildCircle';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext'; // Import the AuthContext

// Customizing the Sidebar Container
const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 260,
  backgroundColor: '#36454F         ', // Indigo color for sidebar background
  color: '#fff',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: theme.spacing(2),
  boxShadow: '2px 0 10px rgba(0,0,0,0.15)', // Adding subtle shadow for depth
}));

// Styling for individual list items
const StyledListItem = styled(ListItem)(({ theme }) => ({
  color: '#fff',
  margin: theme.spacing(0.5, 0),
  borderRadius: '10px',
  transition: 'background-color 0.3s ease, transform 0.2s ease',
  '&:hover': {
    backgroundColor: '#000000', // Slightly lighter shade on hover
    transform: 'translateX(5px)', // Slight movement on hover
  },
}));

// Styling for the logout button
const LogoutButton = styled(ListItem)(({ theme }) => ({
  backgroundColor: '#D9534F',
  color: '#fff',
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color 0.3s, transform 0.3s',
  '&:hover': {
    backgroundColor: '#C9302C',
    transform: 'scale(1.1)', // Slight scaling effect
  },
}));

const Sidebar2 = () => {
  const { user } = useContext(AuthContext); // Get the user from AuthContext
  const handleScroll = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigate = useNavigate(); // Use navigate hook

  return (
    <SidebarContainer>
      {/* Sidebar Title */}
      <Box sx={{ textAlign: "center", mb: 1 }}>
        {" "}
        {/* Reduced margin-bottom */}
        <Typography
          variant="h5"
          sx={{ color: "#FFD700", fontWeight: "bold", padding: 0 }}
        >
          {" "}
          {/* Removed extra padding */}
          HOMITASK
        </Typography>
      </Box>

      {/* List of navigation items */}

      <List sx={{ flexGrow: 1 }}>
        {" "}
        {/* Set flexGrow to 1 to ensure it fills the remaining space 
        {(user?.email === "thashini@email.com" ||
          user?.email === "homitask@gmail.com") && (
          <StyledListItem button onClick={() => navigate("/dashShoppingForm")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Shopping List" />
          </StyledListItem>
        )}
        {(user?.email === "nishitha@email.com" ||
          user?.email === "homitask@gmail.com") && (
          <StyledListItem button onClick={() => navigate("/dashinventoryform")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <InventoryIcon />
            </ListItemIcon>
            <ListItemText primary="Inventory Handling" />
          </StyledListItem>
        )}
    
        {(user?.email === "nishan@email.com" ||
          user?.email === "homitask@gmail.com") && (
          <StyledListItem button onClick={() => navigate("/dashMealForm")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <InventoryIcon />
            </ListItemIcon>
            <ListItemText primary="meal planing" />
          </StyledListItem>
        )}
        {(user?.email === "hashan@email.com" ||
          user?.email === "homitask@gmail.com") && (
          <StyledListItem button onClick={() => navigate("/dashbudgetplanner")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <BuildIcon />
            </ListItemIcon>
            <ListItemText primary="smart shopping" />
          </StyledListItem>
        )}
        {(user?.email === "hashan@email.com" ||
          user?.email === "homitask2@gmail.com") && (
          <StyledListItem button onClick={() => navigate("/dashOrderForm")}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <BuildIcon />
            </ListItemIcon>
            <ListItemText primary="testing" />
          </StyledListItem>
        )} */}
        <StyledListItem button onClick={() => handleScroll("contact-us")}>
          <ListItemIcon sx={{ color: "#fff" }}>
            <ContactMailIcon />
          </ListItemIcon>
          <ListItemText primary="Contact Us" />
        </StyledListItem>
        <StyledListItem button onClick={() => handleScroll("about-us")}>
          <ListItemIcon sx={{ color: "#fff" }}>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary="About Us" />
        </StyledListItem>
      </List>

      <Divider sx={{ backgroundColor: "#fff", my: 2 }} />
    </SidebarContainer>
  );
};

export default Sidebar2;
