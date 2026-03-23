import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  findCategoryById,
  findSubcategoryBySlug,
  getNestedSubcategories,
  getSubcategoryName,
  slugify,
} from "./categoryHelpers";
import "./CategoryStyles.css";

const NestedSubcategoryList = () => {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();

  const categoryDetails = findCategoryById(categoryId);
  const category = categoryDetails?.category;
  const subcategory = findSubcategoryBySlug(category, subcategoryId);
  const nestedSubcategories = getNestedSubcategories(subcategory);

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
                  </div>
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
