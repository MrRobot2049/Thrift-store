import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import "./myTickets.css";
import { apiFetch } from "./forms/apiFetch";
import { API_BASE_URL } from "./apiConfig";

const TYPE_ICONS = { merchandise: "🛍️", comedy: "🎤", event: "🎟️", concert: "🎸" };

export default function MyTickets() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setError("Please log in to view your tickets");
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        const data = await apiFetch(`${API_BASE_URL}/purchases/mine`, {
          credentials: "include",
          headers: { Authorization: token },
        });
        setPurchases(data);
      } catch (err) {
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [token]);

  return (
    <div className="tickets-page">
      <NavBar />
      <div className="tickets-container">
        <h1 className="tickets-title">My Tickets & Purchases</h1>

        {loading ? (
          <p className="status-msg">Loading your collection...</p>
        ) : error ? (
          <p className="status-msg error">{error}</p>
        ) : purchases.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎫</span>
            <p>You haven't bought any tickets or merchandise yet.</p>
            <Link to="/merchandise" className="vintage-btn">Explore Marketplace</Link>
          </div>
        ) : (
          <div className="tickets-grid">
            {purchases.map(p => (
              <div key={p._id} className="ticket-card">
                <div className="ticket-visual">
                  {p.image ? (
                    <img src={p.image} alt={p.itemTitle} />
                  ) : (
                    <div className="no-image">{TYPE_ICONS[p.listingType] || "📦"}</div>
                  )}
                  <div className="ticket-badge">{p.listingType?.toUpperCase()}</div>
                </div>
                
                <div className="ticket-details">
                  <div className="ticket-header">
                    <h3 className="ticket-item-title">{p.itemTitle}</h3>
                    <div className="ticket-id">{p.ticketId}</div>
                  </div>

                  <div className="ticket-info-grid">
                    <div className="info-block">
                      <span className="label">Quantity</span>
                      <span className="value">{p.quantity}</span>
                    </div>
                    {p.tierName && (
                      <div className="info-block">
                        <span className="label">Tier</span>
                        <span className="value">{p.tierName}</span>
                      </div>
                    )}
                    {p.size && (
                      <div className="info-block">
                        <span className="label">Size</span>
                        <span className="value">{p.size}</span>
                      </div>
                    )}
                    <div className="info-block">
                      <span className="label">Total Paid</span>
                      <span className="value success">₹{p.totalPrice.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {(p.venue || p.eventDate || p.headlineArtist) && (
                    <div className="ticket-event-details">
                      {p.headlineArtist && <p>🎤 {p.headlineArtist}</p>}
                      {p.eventDate && <p>📅 {p.eventDate}</p>}
                      {p.venue && <p>📍 {p.venue}</p>}
                    </div>
                  )}
                  
                  <div className="ticket-footer">
                    <span>Purchased on {new Date(p.createdAt).toLocaleDateString()}</span>
                    <Link
                      to={`/chat/purchase/${p._id}`}
                      className="vintage-btn"
                      style={{ marginLeft: "0.75rem", padding: "0.35rem 0.7rem", fontSize: "0.78rem" }}
                    >
                      Chat with Seller
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
