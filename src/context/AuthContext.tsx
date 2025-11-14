import React, { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("jwt"));

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) localStorage.setItem("jwt", newToken);
    else localStorage.removeItem("jwt");
  };

  const logout = () => {
    // Clear auth token and other local state that should not persist across sessions
    setToken(null);
    try {
      localStorage.removeItem("jwt");
      localStorage.removeItem("userid");
      localStorage.removeItem("username");
      localStorage.removeItem("selectedProjectId");
      // Remove project and diagram session stores if present
      localStorage.removeItem("umlstudio.project");
      localStorage.removeItem("umlstudio.diagram.sessions");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("AuthContext.logout: failed to clear localStorage", err);
    }
  };

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
};
