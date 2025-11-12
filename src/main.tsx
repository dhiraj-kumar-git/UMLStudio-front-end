import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { DiagramProvider } from "./context/DiagramContext";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ProjectProvider>
        <DiagramProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </DiagramProvider>
      </ProjectProvider>
    </AuthProvider>
  </React.StrictMode>
);
