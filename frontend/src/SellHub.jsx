import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./sellForms.css";

export default function SellHub() {
  const navigate = useNavigate();

  return (
    <div className="premium-forms-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="hub-wrapper">
        <h1 className="hub-title">Launch Your Listing</h1>
        <p className="hub-subtitle">Select the type of offering you wish to create</p>

        <div className="hub-grid">
          {/* Merch Card */}
          <Link to="/sell/merchandise" className="hub-card card-merch">
            <div className="hub-card-icon">🛍️</div>
            <h2 className="hub-card-title">University Merchandise</h2>
          </Link>

          {/* Comedy Card */}
          <Link to="/sell/comedy" className="hub-card card-comedy">
            <div className="hub-card-icon">🎙️</div>
            <h2 className="hub-card-title">Comedy Performance</h2>
          </Link>

          {/* Event Card */}
          <Link to="/sell/event" className="hub-card card-event">
            <div className="hub-card-icon">🎟️</div>
            <h2 className="hub-card-title">Event Registration</h2>
          </Link>

          {/* Concert Card */}
          <Link to="/sell/concert" className="hub-card card-concert">
            <div className="hub-card-icon">🎸</div>
            <h2 className="hub-card-title">Live Music Concert</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
