import React from "react";
import { Link, Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if ((user.role || "user") !== "admin") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #f7efe1, #efe4cc)",
          padding: "2rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: "#fffaf0",
            border: "1px solid #dabe82",
            borderRadius: 14,
            padding: "1.5rem",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.08)",
            textAlign: "center",
            color: "#3a2a17",
            fontFamily: "Georgia, serif",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Admin Access Required</h2>
          <p style={{ marginBottom: "1.25rem", lineHeight: 1.5 }}>
            Only admin users can post merchandise or show tickets.
          </p>
          <Link
            to="/merchandise"
            style={{
              display: "inline-block",
              padding: "0.6rem 1rem",
              borderRadius: 8,
              textDecoration: "none",
              border: "1px solid #7a5e3d",
              color: "#4a3826",
              fontWeight: 600,
            }}
          >
            Back To Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
