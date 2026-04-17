import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import { getWishlistItems, subscribeToWishlist, toggleWishlistItem } from "./wishlistStorage";
import "./home.css";
import "./wishlist.css";

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState(() => getWishlistItems());

  useEffect(() => {
    return subscribeToWishlist(setWishlistItems);
  }, []);

  const handleRemove = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setWishlistItems(toggleWishlistItem(item));
  };

  return (
    <div className="home-container wishlist-page">
      <NavBar />

      <div className="home-header wishlist-header">
        <h1>Your Wishlist</h1>
        <p>Keep an eye on the listings you want to revisit before they slip away.</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="home-empty wishlist-empty">
          <p>Your wishlist is empty right now.</p>
          <Link to="/home" className="wishlist-browse-link">
            Browse available items
          </Link>
        </div>
      ) : (
        <div className="wood-grid">
          {wishlistItems.map((item) => {
            const previewImage =
              item.image || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : "");

            return (
              <Link to={`/items/${item._id}`} key={item._id} className="wood-card-link">
                <div className="wood-card wishlist-card">
                  <button
                    type="button"
                    className="wishlist-toggle active"
                    onClick={(event) => handleRemove(event, item)}
                    aria-label={`Remove ${item.title} from wishlist`}
                    title="Remove from wishlist"
                  >
                    ♥
                  </button>

                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>

                  <div className="wood-card-inner">
                    <div className="wood-image-frame">
                      <div className="wood-image-inner">
                        {previewImage ? (
                          <img src={previewImage} alt={item.title} className="wood-image" />
                        ) : (
                          <div className="wood-no-image">No Image</div>
                        )}
                      </div>
                    </div>

                    <div className="wood-content">
                      <h3 className="wood-title">{item.title || "Untitled"}</h3>
                      <p className="wood-category">{item.category || "Uncategorized"}</p>
                      <p className="wood-description">{item.description || "No description"}</p>

                      <div className="wood-footer">
                        <div className="wood-price-col">
                          <span className="wood-label">ASKING<br />PRICE</span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
