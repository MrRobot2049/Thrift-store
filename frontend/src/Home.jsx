import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import { fetchWishlistSubscriptions, subscribeToWishlist } from "./wishlistStorage";
import { categoriesData } from "./data/categories";
import { getNestedSubcategories, getSubcategoryName } from "./categoryHelpers";
import "./home.css";
import { API_BASE_URL } from "./apiConfig";

export default function Home() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [wishlistCount, setWishlistCount] = useState(0);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CATEGORIES = Object.keys(categoriesData);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsRes = await fetch(`${API_BASE_URL}/items`, {
          credentials: "include",
        });
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

  useEffect(() => {
    let isMounted = true;

    fetchWishlistSubscriptions()
      .then((subscriptions) => {
        if (isMounted) {
          setWishlistCount(subscriptions.length);
        }
      })
      .catch(() => null);

    const unsubscribe = subscribeToWishlist((subscriptions) => {
      if (isMounted) {
        setWishlistCount(subscriptions.length);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    const subcategorySet = new Set();
    const category = categoriesData[selectedCategory];

    if (category?.subcategories?.length) {
      category.subcategories.forEach((subcategory) => {
        const subName = getSubcategoryName(subcategory);
        if (subName) {
          subcategorySet.add(subName);
        }

        getNestedSubcategories(subcategory).forEach((nested) => {
          if (nested) {
            subcategorySet.add(nested);
          }
        });
      });
    } else {
      const scopedItems = items.filter(
        (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );

      scopedItems.forEach((item) => {
        if (item.subcategory) {
          subcategorySet.add(item.subcategory.trim());
        }
        if (item.nestedSubcategory) {
          subcategorySet.add(item.nestedSubcategory.trim());
        }
      });
    }

    return Array.from(subcategorySet).sort((left, right) => left.localeCompare(right));
  }, [items, selectedCategory]);

  const displayedItems = items
    .filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSubcategory =
        selectedSubcategory === "" ||
        item.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase() ||
        item.nestedSubcategory?.toLowerCase() === selectedSubcategory.toLowerCase();

      return matchesSearch && matchesCategory && matchesSubcategory;
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

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "" ||
    selectedSubcategory !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSortBy("newest");
  };

  return (
    <div className="home-container">
      <NavBar />
      {error && <p className="home-error">{error}</p>}
      
      <div className="home-header">
        <h1>Browse Items for Auction</h1>
        <p>Select any item to view details and place your bid</p>
        <Link to="/wishlist" className="wishlist-summary-link">
          Wishlist: {wishlistCount} watched subcategor{wishlistCount === 1 ? "y" : "ies"}
        </Link>
      </div>

      <div className="sell-banner-wrapper">
        <div className="sell-banner" style={{ background: "linear-gradient(135deg, #fcfaf8, #f4eee6)" }}>
          <div className="sell-banner-text">
            🎓 Looking for college merchandise or event tickets?
          </div>
          <Link to="/merchandise" className="metallic-button banner-btn" style={{ textDecoration: 'none' }}>
            Browse Merch & Tickets
          </Link>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="wood-search-input"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search items"
          />
        </div>

        <div className="category-filter-wrapper">
          <select
            className="wood-category-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
            }}
            aria-label="Filter by category"
          >
            <option value="">Choose a Category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {selectedCategory && (
          <div className="subcategory-filter-wrapper">
            <select
              className="wood-category-select"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              aria-label="Filter by subcategory"
              disabled={availableSubcategories.length === 0}
            >
              <option value="">Choose a Subcategory</option>
              {availableSubcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>
        )}

        <div className="sort-filter-wrapper">
          <select
            className="wood-category-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort items"
          >
            <option value="newest">Sort By: Newest First</option>
            <option value="name-asc">Sort By: Name (A-Z)</option>
            <option value="name-desc">Sort By: Name (Z-A)</option>
            <option value="price-asc">Sort By: Price (Low to High)</option>
            <option value="price-desc">Sort By: Price (High to Low)</option>
          </select>
        </div>

        <div className="results-summary-wrapper">
          <p className="results-count">
            Showing {displayedItems.length} of {items.length} items
          </p>
          {hasActiveFilters && (
            <button type="button" className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {displayedItems.length === 0 ? (
        <div className="home-empty">
          <p>{items.length === 0 ? "No items available right now." : "No items match your search."}</p>
        </div>
      ) : (
        <div className="wood-grid">
          {displayedItems.map((item, index) => (
            <Link
              to={`/items/${item._id}`}
              key={item._id}
              className="wood-card-link"
              style={{ "--stagger-index": index }}
            >
              <div className="wood-card">


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
                    <p className="wood-category">
                      {[item.category, item.subcategory, item.nestedSubcategory]
                        .filter(Boolean)
                        .join(" / ") || "Uncategorized"}
                    </p>
                    <p className="wood-description">{item.description || "No description"}</p>
                    
                    <div className="wood-footer">
                      <div className="wood-price-col">
                        <span className="wood-label">ASKING<br/>PRICE</span>
                        <span className="wood-value">
                          {formatCurrency(item.askingPrice)}
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
