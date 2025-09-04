import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Import Context Providers
import { AuthProvider } from "./context/AuthContext";


// Import Pages
import StartupPage from "./pages/StartupPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Home from "./pages/Home";








const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <AuthProvider>
      

      <Routes>
        <Route path="/" element={<StartupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app" element={<Home />} />
      
   
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

reportWebVitals();
