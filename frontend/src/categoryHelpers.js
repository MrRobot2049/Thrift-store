import { categoriesData } from "./data/categories";

export const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

export const getSubcategoryName = (subcategory) =>
  typeof subcategory === "string" ? subcategory : subcategory?.name || "";

export const hasNestedSubcategories = (subcategory) =>
  typeof subcategory !== "string" &&
  Array.isArray(subcategory?.subcategories) &&
  subcategory.subcategories.length > 0;

export const getNestedSubcategories = (subcategory) =>
  hasNestedSubcategories(subcategory) ? subcategory.subcategories : [];

export const findCategoryById = (categoryId) => {
  const categoryKey = Object.keys(categoriesData).find(
    (key) => categoriesData[key].id === categoryId
  );

  if (!categoryKey) {
    return null;
  }

  return {
    categoryKey,
    category: categoriesData[categoryKey],
  };
};

export const findSubcategoryBySlug = (category, subcategorySlug) => {
  if (!category?.subcategories || !subcategorySlug) {
    return null;
  }

  return (
    category.subcategories.find(
      (subcategory) => slugify(getSubcategoryName(subcategory)) === subcategorySlug
    ) || null
  );
};

export const formatSlug = (slug = "") =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
