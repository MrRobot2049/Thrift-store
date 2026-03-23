import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import "./home.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function Home() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const CATEGORIES = [
    "Books",
    "Cycles",
    "Heaters",
    "Furniture",
    "Hostel Essentials",
    "Electronics",
    "Kitchen Items",
    "Clothing",
    "Bags",
    "Others",
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsRes = await fetch(`${API_BASE_URL}/items`);
        if (!itemsRes.ok) throw new Error("Failed to load items");

        const itemsData = await itemsRes.json();
        
        // Filter out user's own items
        const filteredItems = itemsData.filter(
          item => item.seller?._id !== currentUser.id
        );
        setItems(filteredItems);
      } catch (err) {
        console.error("Error fetching items:", err);
        setError(err.message);
      }
    };

    fetchItems();
  }, [currentUser.id]);

  const displayedItems = items
    .filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const titleA = (a.title || "").toLowerCase();
      const titleB = (b.title || "").toLowerCase();
      const priceA = Number(a.askingPrice) || 0;
      const priceB = Number(b.askingPrice) || 0;
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();

      if (sortBy === "name-asc") return titleA.localeCompare(titleB);
      if (sortBy === "name-desc") return titleB.localeCompare(titleA);
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;

      // Default sort: newest items first
      return createdB - createdA;
    });

  return (
    <div className="home-container">
      <NavBar />
      {error && <p className="home-error">{error}</p>}
      
      <div className="home-header">
        <h1>Browse Items for Auction</h1>
        <p>Select any item to view details and place your bid</p>
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="wood-search-input"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filter-wrapper">
          <select
            className="wood-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Choose a Category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="sort-filter-wrapper">
          <select
            className="wood-category-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort By: Newest First</option>
            <option value="name-asc">Sort By: Name (A-Z)</option>
            <option value="name-desc">Sort By: Name (Z-A)</option>
            <option value="price-asc">Sort By: Price (Low to High)</option>
            <option value="price-desc">Sort By: Price (High to Low)</option>
          </select>
        </div>
      </div>

      {displayedItems.length === 0 ? (
        <div className="home-empty">
          <p>{items.length === 0 ? "No items available right now." : "No items match your search."}</p>
        </div>
      ) : (
        <div className="wood-grid">
          {displayedItems.map((item) => (
            <Link to={`/items/${item._id}`} key={item._id} className="wood-card-link">
              <div className="wood-card">
                {/* Golden corner flourishes */}
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>

                <div className="wood-card-inner">
                  {/* Image Frame */}
                  <div className="wood-image-frame">
                    <div className="wood-image-inner">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="wood-image"
                        />
                      ) : (
                        <div className="wood-no-image">No Image</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="wood-content">
                    <h3 className="wood-title">{item.title || "Untitled"}</h3>
                    <p className="wood-category">{item.category || "Uncategorized"}</p>
                    <p className="wood-description">{item.description || "No description"}</p>
                    
                    <div className="wood-footer">
                      <div className="wood-price-col">
                        <span className="wood-label">ASKING<br/>PRICE</span>
                        <span className="wood-value">
                          {item.askingPrice ? `₹${item.askingPrice}` : "N/A"}
                        </span>
                      </div>
                      <div className="wood-seller-col">
                        <span className="wood-seller-text">by {item.seller?.name || "Unknown"}</span>
                      </div>
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