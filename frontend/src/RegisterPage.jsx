import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./register.css";
import { API_BASE_URL } from "./apiConfig";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    stream: "",
    branch: "",
    year: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "stream") {
      setForm((prev) => ({
        ...prev,
        stream: value,
        year: value === "Others" ? "N/A" : "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const yearOptions = (() => {
    switch (form.stream) {
      case "MTech":
      case "MSc":
        return [
          { value: "1", label: "1st Year" },
          { value: "2", label: "2nd Year" },
        ];
      case "PhD":
        return [
          { value: "1", label: "1st Year" },
          { value: "2", label: "2nd Year" },
          { value: "3", label: "3rd Year" },
          { value: "4", label: "4th Year" },
          { value: "5", label: "5th Year" },
        ];
      case "Others":
        return [{ value: "N/A", label: "N/A" }];
      default:
        return [
          { value: "1", label: "1st Year" },
          { value: "2", label: "2nd Year" },
          { value: "3", label: "3rd Year" },
          { value: "4", label: "4th Year" },
        ];
    }
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpSent) {
      if (
        !form.name ||
        !form.email ||
        !form.mobile ||
        !form.password ||
        !form.confirmPassword ||
        !form.stream ||
        !form.branch ||
        !form.year
      ) {
        setError("Please fill all fields.");
        return;
      }

      if (form.mobile.length !== 10 || isNaN(form.mobile)) {
        setError("Enter a valid 10-digit mobile number.");
        return;
      }

      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/auth/register/request-otp`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.message || "Could not send OTP");
          return;
        }

        setOtpSent(true);
        setSuccess("OTP sent to your email. Enter it below to complete registration.");
      } catch (err) {
        setError("Network error while sending OTP");
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!otp.trim()) {
      setError("Please enter OTP.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/register/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          otp: otp.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "OTP verification failed");
        return;
      }

      setSuccess("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setError("Network error while verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          <span className="auth-title-welcome">Welcome to</span>
          <br />
          Thrift Store
        </h2>
        <p className="auth-subtitle">Create your account</p>

        {error && (
          <div className="auth-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-alert success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-item">
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              disabled={otpSent}
              className="form-input with-icon"
            />
          </div>

          <div className="form-item">
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              disabled={otpSent}
              className="form-input with-icon"
            />
          </div>

          <div className="form-item">
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <input
              type="tel"
              name="mobile"
              placeholder="Mobile Number"
              value={form.mobile}
              onChange={handleChange}
              disabled={otpSent}
              className="form-input with-icon"
            />
          </div>

          <div className="form-row">
            <div className="form-item">
              <select
                name="stream"
                value={form.stream}
                onChange={handleChange}
                disabled={otpSent}
                className="form-select"
              >
                <option value="">Stream</option>
                <option value="BTech">BTech</option>
                <option value="MTech">MTech</option>
                <option value="MSc">MSc</option>
                <option value="PhD">PhD</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="form-item">
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                disabled={otpSent || form.stream === "Others"}
                className="form-select"
              >
                <option value="">Year</option>
                {yearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-item">
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <input
              type="text"
              name="branch"
              placeholder="Branch (e.g. CSE)"
              value={form.branch}
              onChange={handleChange}
              disabled={otpSent}
              className="form-input with-icon"
            />
          </div>

          <div className="form-item">
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              disabled={otpSent}
              className="form-input with-icon"
            />
          </div>

          <div className="form-item">
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={otpSent}
              className="form-input with-icon"
            />
          </div>

          {otpSent && (
            <div className="form-item">
              <input
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Let's Begin"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/" className="auth-link">Login here.</Link>
        </p>
      </div>
    </div>
  );
}
