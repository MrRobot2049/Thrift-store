import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  findCategoryById,
  findSubcategoryBySlug,
  getNestedSubcategories,
  getSubcategoryName,
  slugify,
} from "./categoryHelpers";
import {
  fetchWishlistSubscriptions,
  formatWishlistLabel,
  isWishlistedSubscription,
  toggleWishlistSubscription,
} from "./wishlistStorage";
import "./CategoryStyles.css";

const NestedSubcategoryList = () => {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();
  const [wishlistSubscriptions, setWishlistSubscriptions] = useState([]);

  const categoryDetails = findCategoryById(categoryId);
  const categoryName = categoryDetails?.categoryKey || "";
  const category = categoryDetails?.category;
  const subcategory = findSubcategoryBySlug(category, subcategoryId);
  const nestedSubcategories = getNestedSubcategories(subcategory);

  useEffect(() => {
    fetchWishlistSubscriptions()
      .then(setWishlistSubscriptions)
      .catch(() => null);
  }, []);

  const handleWishlistToggle = async (event, subscription) => {
    event.stopPropagation();

    try {
      const updatedSubscriptions = await toggleWishlistSubscription(
        subscription,
        wishlistSubscriptions
      );
      setWishlistSubscriptions(updatedSubscriptions);
    } catch (error) {
      console.error("Failed to update wishlist subscription:", error);
    }
  };

  if (!category || !subcategory || nestedSubcategories.length === 0) {
    return (
      <div
        className="category-page"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <h2>Subcategory Not Found</h2>
        <button onClick={() => navigate("/categories")}>Go Root Category</button>
      </div>
    );
  }

  return (
    <div className="category-page">
      <header className="category-header">
        <button className="back-button" onClick={() => navigate(-1)} aria-label="Go back">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="header-title">{getSubcategoryName(subcategory)}</h1>
      </header>

      <main className="category-main">
        <div className="category-container">
          <h2 className="category-title">CHOOSE A SUBCATEGORY</h2>
          <ul className="category-list">
            {nestedSubcategories.map((nestedSubcategory, index) => {
              const nestedSubcategorySlug = slugify(nestedSubcategory);
              const subscription = {
                categoryId,
                categoryName,
                subcategorySlug: subcategoryId,
                subcategoryName: getSubcategoryName(subcategory),
                nestedSubcategorySlug,
                nestedSubcategoryName: nestedSubcategory,
              };
              const isWatching = isWishlistedSubscription(subscription, wishlistSubscriptions);

              return (
                <li
                  key={index}
                  className="category-item"
                  onClick={() =>
                    navigate(
                      `/category/${categoryId}/${subcategoryId}/${nestedSubcategorySlug}`
                    )
                  }
                >
                  <div className="category-item-content">
                    <span className="category-name">{nestedSubcategory}</span>
                    <span className="category-meta">{formatWishlistLabel(subscription)}</span>
                  </div>
                  <button
                    type="button"
                    className={`category-watch-btn ${isWatching ? "active" : ""}`}
                    onClick={(event) => handleWishlistToggle(event, subscription)}
                  >
                    {isWatching ? "Watching" : "Watch"}
                  </button>
                  <span className="category-arrow">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default NestedSubcategoryList;
