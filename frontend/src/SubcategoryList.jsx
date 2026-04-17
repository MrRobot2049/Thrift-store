import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoriesData } from './data/categories';
import { getSubcategoryName, slugify } from './categoryHelpers';
import {
  fetchWishlistSubscriptions,
  formatWishlistLabel,
  isWishlistedSubscription,
  toggleWishlistSubscription,
} from "./wishlistStorage";
import './CategoryStyles.css';

const SubcategoryList = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [wishlistSubscriptions, setWishlistSubscriptions] = useState([]);

  // Find the category key matching the ID from URL
  const categoryKey = Object.keys(categoriesData).find(
    (key) => categoriesData[key].id === categoryId
  );
  const category = categoryKey ? categoriesData[categoryKey] : null;

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

  if (!category) {
    return (
      <div className="category-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h2>Category Not Found</h2>
        <button onClick={() => navigate('/')}>Go Root Category</button>
      </div>
    );
  }

  return (
    <div className="category-page">
      <header className="category-header">
        <button className="back-button" onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="header-title">{categoryKey}</h1>
      </header>
      
      <main className="category-main">
        <div className="category-container">
          <h2 className="category-title">CHOOSE A SUBCATEGORY</h2>
          <ul className="category-list">
            {category.subcategories.map((sub, index) => {
              const subName = getSubcategoryName(sub);
              const subSlug = slugify(subName);
              const subscription = {
                categoryId,
                categoryName: categoryKey,
                subcategorySlug: subSlug,
                subcategoryName: subName,
                nestedSubcategorySlug: "",
                nestedSubcategoryName: "",
              };
              const isWatching = isWishlistedSubscription(subscription, wishlistSubscriptions);
              
              return (
                <li 
                  key={index} 
                  className="category-item" 
                  onClick={() => navigate(`/category/${categoryId}/${subSlug}`)}
                >
                  <div className="category-item-content">
                    <span className="category-name">{subName}</span>
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

export default SubcategoryList;
