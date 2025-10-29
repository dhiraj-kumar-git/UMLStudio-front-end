import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthController } from "../controller/AuthController";
import { useAuthContext } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setToken } = useAuthContext();
  const controller = new AuthController();

  type LoginErrorState = {
    username?: string;
    password?: string;
    general?: string | null;
  };

  const [errors, setErrors] = useState<LoginErrorState>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    await controller.handleLogin(
      username,
      password,
      setToken,
      navigate,
      (msg) => setErrors((prev) => ({ ...prev, general: msg }))
    );
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Login to access your dashboard</p>

        <div className="form-grid-single">
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((prev) => ({ ...prev, username: undefined }));
              }}
            />
            {errors.username && (
              <span className="input-error">{errors.username}</span>
            )}
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            {errors.password && (
              <span className="input-error">{errors.password}</span>
            )}
          </div>
        </div>

        {errors.general && <p className="input-error-general">{errors.general}</p>}

        <button className="button" onClick={handleLogin}>
          Login
        </button>

        <div className="link-text">
          Don’t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};
