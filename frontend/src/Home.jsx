// frontend/src/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import "./home.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function Home() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsRes = await fetch(`${API_BASE_URL}/items`);
        if (!itemsRes.ok) throw new Error("Failed to load items");

        const itemsData = await itemsRes.json();
        console.log("Items fetched:", itemsData);
        
        // Filter out user's own items
        const filteredItems = itemsData.filter(
          item => item.seller?._id !== currentUser.id
        );
        console.log("Filtered items:", filteredItems);
        setItems(filteredItems);
      } catch (err) {
        console.error("Error fetching items:", err);
        setError(err.message);
      }
    };

    fetchItems();
  }, [currentUser.id]);

  return (
    <div className="home-container">
      <NavBar />
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <div className="home-header">
        <h1>Browse Items for Auction</h1>
        <p>Select any item to view details and place your bid</p>
      </div>

      {/* CTA: Sell something */}
      <div className="sell-cta-banner">
        <div className="sell-cta-content">
          <span className="sell-cta-text">Have something to sell?</span>
          <Link to="/categories" className="sell-cta-btn">
            + Post Your Ad
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No items available right now.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <Link
              to={`/items/${item._id}`}
              key={item._id}
              className="item-card-link"
            >
              <div className="item-card">
                {item.image && (
                  <div className="item-image-container">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="item-image"
                    />
                  </div>
                )}
                <div className="item-content">
                  <h3 className="item-title">{item.title || "Untitled"}</h3>
                  <p className="item-category">{item.category || "Uncategorized"}</p>
                  <p className="item-description">{item.description || "No description"}</p>
                  
                  <div className="item-footer">
                    <div className="price-section">
                      <span className="price-label">Asking Price</span>
                      <span className="price-value">
                        {item.askingPrice ? `₹${item.askingPrice}` : "N/A"}
                      </span>
                    </div>
                    <div className="seller-section">
                      <small>by {item.seller?.name || "unknown"}</small>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}