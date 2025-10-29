import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export const HomePage: React.FC = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "Guest";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="home-page">
      <h1>Hello, {name}</h1>
      <p>Welcome to UMLStudio!</p>
      <button onClick={handleLogout} className="button" style={{ marginTop: "2rem" }}>
        Logout
      </button>
    </div>
  );
};
