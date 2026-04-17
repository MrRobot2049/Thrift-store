const WISHLIST_STORAGE_KEY = "wishlistItems";
const WISHLIST_EVENT = "wishlist-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notifyWishlistChanged(items) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WISHLIST_EVENT, {
        detail: { items },
      })
    );
  }
}

function normalizeWishlistItem(item) {
  return {
    _id: item._id,
    title: item.title || "Untitled",
    description: item.description || "",
    category: item.category || "Uncategorized",
    askingPrice: item.askingPrice || "",
    image: item.image || "",
    images: Array.isArray(item.images) ? item.images : [],
    seller: item.seller || null,
  };
}

export function getWishlistItems() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read wishlist:", error);
    return [];
  }
}

function saveWishlistItems(items) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  notifyWishlistChanged(items);
}

export function getWishlistIds() {
  return getWishlistItems().map((item) => item._id).filter(Boolean);
}

export function isItemWishlisted(itemId) {
  return getWishlistIds().includes(itemId);
}

export function toggleWishlistItem(item) {
  if (!item?._id) {
    return [];
  }

  const wishlistItems = getWishlistItems();
  const exists = wishlistItems.some((wishlistItem) => wishlistItem._id === item._id);

  const updatedItems = exists
    ? wishlistItems.filter((wishlistItem) => wishlistItem._id !== item._id)
    : [normalizeWishlistItem(item), ...wishlistItems];

  saveWishlistItems(updatedItems);
  return updatedItems;
}

export function subscribeToWishlist(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = (event) => {
    const items = event.detail?.items;
    callback(Array.isArray(items) ? items : getWishlistItems());
  };

  window.addEventListener(WISHLIST_EVENT, handleChange);

  return () => {
    window.removeEventListener(WISHLIST_EVENT, handleChange);
  };
}
