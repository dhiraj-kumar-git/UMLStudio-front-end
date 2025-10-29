import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthController } from "../controller/AuthController";
import type { RegisterPayload } from "../services/AuthService";

export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState<RegisterPayload>({
    username: "",
    name: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterPayload, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const navigate = useNavigate();
  const controller = new AuthController();

  const handleChange = (key: keyof RegisterPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setGeneralError(null);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterPayload, string>> = {};
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.password.trim()) newErrors.password = "Password is required";
    if (!form.confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setGeneralError(null);
    if (!validate()) return;
    await controller.handleRegister(form, navigate, setGeneralError);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Account</h2>
        <p>Join our platform and get started instantly</p>

        <div className="form-grid">
          {/* Username */}
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
            />
            {errors.username && <span className="input-error">{errors.username}</span>}
          </div>

          {/* Name */}
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && <span className="input-error">{errors.name}</span>}
          </div>

          {/* Password */}
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
            {errors.password && <span className="input-error">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
            />
            {errors.confirmPassword && (
              <span className="input-error">{errors.confirmPassword}</span>
            )}
          </div>
        </div>

        {generalError && <p className="input-error-general">{generalError}</p>}

        <button className="button" onClick={handleRegister}>
          Register
        </button>

        <div className="link-text">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};
