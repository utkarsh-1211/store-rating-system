import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword
} from "../utils/validators";
import "./Register.css";

const API_BASE_URL = "http://localhost:5000";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      address: validateAddress(formData.address),
      password: validatePassword(formData.password)
    };

    const filtered = Object.fromEntries(
      Object.entries(newErrors).filter(([, msg]) => msg !== "")
    );
    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || "Registration failed.");
        return;
      }

      setSuccessMsg("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setServerError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Account</h2>
        <p className="register-subtitle">Sign up to rate and review local stores</p>

        {serverError && <div className="register-alert error">{serverError}</div>}
        {successMsg && <div className="register-alert success">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="register-group">
            <label htmlFor="name">
              Full Name <span className="char-count">({formData.name.trim().length}/60)</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter full name (20–60 characters)"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="register-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="register-group">
            <label htmlFor="address">
              Address <span className="char-count">({formData.address.trim().length}/400)</span>
            </label>
            <textarea
              id="address"
              name="address"
              rows="3"
              placeholder="Enter your full address (max 400 characters)"
              value={formData.address}
              onChange={handleChange}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          <div className="register-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="8–16 chars, 1 uppercase, 1 special char"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="register-btn" disabled={submitting}>
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;