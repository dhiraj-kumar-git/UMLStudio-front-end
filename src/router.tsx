import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import InfiniteCanvas from "./components/InfiniteCanvas";
import { useAuthContext } from "./context/AuthContext";

export const AppRouter: React.FC = () => {
  const { token } = useAuthContext();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/home"
          element={token ? <HomePage /> : <Navigate to="/login" />}
        />
  <Route path="/demo" element={<InfiniteCanvas />} />
      </Routes>
    </BrowserRouter>
  );
};
