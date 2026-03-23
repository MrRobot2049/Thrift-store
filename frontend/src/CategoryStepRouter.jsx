import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import NestedSubcategoryList from "./NestedSubcategoryList";
import PostAdView from "./PostAdView";
import {
  findCategoryById,
  findSubcategoryBySlug,
  hasNestedSubcategories,
} from "./categoryHelpers";
import "./CategoryStyles.css";

const CategoryStepRouter = () => {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();

  const categoryDetails = findCategoryById(categoryId);
  const category = categoryDetails?.category;
  const subcategory = findSubcategoryBySlug(category, subcategoryId);

  if (!category || !subcategory) {
    return (
      <div
        className="category-page"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <h2>Category Not Found</h2>
        <button onClick={() => navigate("/categories")}>Go Root Category</button>
      </div>
    );
  }

  if (hasNestedSubcategories(subcategory)) {
    return <NestedSubcategoryList />;
  }

  return <PostAdView />;
};

export default CategoryStepRouter;
