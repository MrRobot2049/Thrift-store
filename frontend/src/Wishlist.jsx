import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import {
  fetchWishlistSubscriptions,
  formatWishlistLabel,
  removeWishlistSubscription,
  subscribeToWishlist,
} from "./wishlistStorage";
import "./home.css";
import "./wishlist.css";

export default function Wishlist() {
  const [wishlistSubscriptions, setWishlistSubscriptions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchWishlistSubscriptions()
      .then((subscriptions) => {
        if (isMounted) {
          setWishlistSubscriptions(subscriptions);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      });

    const unsubscribe = subscribeToWishlist((subscriptions) => {
      if (isMounted) {
        setWishlistSubscriptions(subscriptions);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleRemove = async (subscription) => {
    try {
      const updatedSubscriptions = await removeWishlistSubscription(subscription);
      setWishlistSubscriptions(updatedSubscriptions);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="home-container wishlist-page">
      <NavBar />

      <div className="home-header wishlist-header">
        <h1>Your Wishlist</h1>
        <p>Watch subcategories and get notified when a new matching auction is posted.</p>
        <Link to="/categories" className="wishlist-browse-link">
          Add another subcategory
        </Link>
      </div>

      {error && <p className="home-error">{error}</p>}

      {wishlistSubscriptions.length === 0 ? (
        <div className="home-empty wishlist-empty">
          <p>You are not watching any subcategories yet.</p>
        </div>
      ) : (
        <div className="wishlist-subscription-list">
          {wishlistSubscriptions.map((subscription) => (
            <div
              key={`${subscription.categoryId}-${subscription.subcategorySlug}-${subscription.nestedSubcategorySlug || "root"}`}
              className="wishlist-subscription-card"
            >
              <div>
                <p className="wishlist-subscription-label">Watching</p>
                <h3 className="wishlist-subscription-title">{formatWishlistLabel(subscription)}</h3>
              </div>
              <button
                type="button"
                className="wishlist-remove-btn"
                onClick={() => handleRemove(subscription)}
              >
                Stop watching
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
