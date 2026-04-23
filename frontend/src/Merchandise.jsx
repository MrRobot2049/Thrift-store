import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import "./merchandise.css";

const API_BASE_URL = "/api";

const TYPE_LABELS = {
  merchandise: "Merch",
  comedy: "Comedy Show",
  event: "Event",
  concert: "Concert",
};

const TYPE_ICONS = {
  merchandise: "🛍️",
  comedy: "🎤",
  event: "🎟️",
  concert: "🎸",
};

const FILTER_TABS = [
  { key: "all", label: "All Products" },
  { key: "merchandise", label: "T-shirts & Merch" },
  { key: "comedy", label: "Comedy Shows" },
  { key: "event", label: "Events" },
  { key: "concert", label: "Concerts" },
];

export default function Merchandise() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const url =
          activeFilter === "all"
            ? `${API_BASE_URL}/items/merchandise`
            : `${API_BASE_URL}/items/merchandise?type=${activeFilter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load merchandise");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [activeFilter]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  const displayed = items
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      return (
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return (a.askingPrice || 0) - (b.askingPrice || 0);
      if (sortBy === "price-high") return (b.askingPrice || 0) - (a.askingPrice || 0);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

  return (
    <div className="merch-container">
      <NavBar />

      {/* Hero Header */}
      <div className="merch-header">
        <h1>College Merchandise & Tickets</h1>
        <p>Buy and sell exclusive college merch, fest tickets, and more.</p>
        <Link to="/sell-hub" className="sell-merch-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Sell Merch or Tickets
        </Link>
      </div>

      <div className="merch-content-wrapper">
        {/* Sidebar */}
        <aside className="merch-sidebar">
          <div className="sidebar-section">
            <h3>Browse by</h3>
            <ul className="sidebar-list">
              {FILTER_TABS.map((tab) => (
                <li key={tab.key}>
                  <span
                    className={`sidebar-link ${activeFilter === tab.key ? "active" : ""}`}
                    onClick={() => setActiveFilter(tab.key)}
                  >
                    {tab.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick stats */}
          <div className="sidebar-section">
            <h3>Listed Items</h3>
            <ul className="sidebar-list" style={{ fontSize: "0.9rem" }}>
              <li style={{ color: "#7a5e3d", marginBottom: "0.4rem" }}>🛍️ Merch: {items.filter(i => i.listingType === "merchandise").length}</li>
              <li style={{ color: "#7a5e3d", marginBottom: "0.4rem" }}>🎤 Comedy: {items.filter(i => i.listingType === "comedy").length}</li>
              <li style={{ color: "#7a5e3d", marginBottom: "0.4rem" }}>🎟️ Events: {items.filter(i => i.listingType === "event").length}</li>
              <li style={{ color: "#7a5e3d" }}>🎸 Concerts: {items.filter(i => i.listingType === "concert").length}</li>
            </ul>
          </div>
        </aside>

        {/* Main Grid */}
        <main className="merch-main">
          {/* Toolbar */}
          <div className="merch-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span className="merch-count">{displayed.length} products</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "0.4rem 0.8rem", border: "1px solid rgba(139,105,20,0.3)",
                  borderRadius: 6, fontFamily: "Inter, sans-serif", fontSize: "0.9rem",
                  background: "white", color: "#2b1d0f", outline: "none",
                }}
              />
            </div>
            <div className="merch-sort">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Sort by: Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && <p style={{ color: "#c33", textAlign: "center", padding: "2rem" }}>{error}</p>}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "4rem", color: "#7a5e3d" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem", animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
              <p>Loading merchandise...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && displayed.length === 0 && (
            <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛍️</div>
              <h3 style={{ color: "#4a3826", fontFamily: "Playfair Display, serif", marginBottom: "0.5rem" }}>
                No items listed yet
              </h3>
              <p style={{ color: "#7a5e3d", marginBottom: "1.5rem" }}>Be the first to list merchandise or tickets!</p>
              <Link to="/sell-hub" className="sell-merch-btn">+ List an Item</Link>
            </div>
          )}

          {/* Grid */}
          {!loading && displayed.length > 0 && (
            <div className="merch-grid">
              {displayed.map((item) => (
                <Link to={`/items/${item._id}`} key={item._id} className="merch-card">
                  <div className="merch-image-wrapper">
                    {item.image ? (
                      <img src={item.image} alt={item.title} loading="lazy" />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#adb5bd", gap: "0.5rem" }}>
                        <span style={{ fontSize: "2.5rem" }}>{TYPE_ICONS[item.listingType] || "📦"}</span>
                        <span style={{ fontSize: "0.8rem" }}>No Image</span>
                      </div>
                    )}
                    {/* Type badge */}
                    <div style={{
                      position: "absolute", top: 10, left: 10,
                      background: "rgba(43, 29, 15, 0.85)", color: "#dabe82",
                      fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px",
                      borderRadius: 20, letterSpacing: "0.04em",
                    }}>
                      {TYPE_ICONS[item.listingType]} {TYPE_LABELS[item.listingType] || item.category}
                    </div>
                  </div>

                  <div className="merch-info">
                    <h4 className="merch-title">{item.title}</h4>

                    {/* Sizes (for merchandise) */}
                    {item.sizes && item.sizes.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: "0.5rem" }}>
                        {item.sizes.map((s) => (
                          <span key={s} style={{ fontSize: "0.7rem", border: "1px solid #dabe82", borderRadius: 4, padding: "1px 6px", color: "#4a3826" }}>{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Ticket tiers (for comedy/concert) */}
                    {item.ticketTiers && item.ticketTiers.length > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "#7a5e3d", marginBottom: "0.5rem" }}>
                        {item.ticketTiers.map((t) => (
                          <span key={t.tierName} style={{ marginRight: 8 }}>{t.tierName}: ₹{t.price}</span>
                        ))}
                      </div>
                    )}

                    {/* Venue / date */}
                    {item.venue && (
                      <p style={{ fontSize: "0.78rem", color: "#9b8770", margin: "0 0 0.3rem" }}>📍 {item.venue}</p>
                    )}
                    {item.eventDate && (
                      <p style={{ fontSize: "0.78rem", color: "#9b8770", margin: "0 0 0.5rem" }}>📅 {item.eventDate}</p>
                    )}

                    <div className="merch-price">
                      {item.askingPrice > 0 ? formatCurrency(item.askingPrice) : "Free"}
                    </div>

                    <p style={{ fontSize: "0.72rem", color: "#9b8770", margin: "0.3rem 0 0" }}>
                      by {item.seller?.name || "Unknown"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
