const WISHLIST_EVENT = "wishlist-updated";
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function notifyWishlistChanged(subscriptions) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WISHLIST_EVENT, {
        detail: { subscriptions },
      })
    );
  }
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: localStorage.getItem("token"),
  };
}

function normalizeWishlistSubscription(subscription) {
  return {
    categoryId: subscription.categoryId,
    categoryName: subscription.categoryName,
    subcategorySlug: subscription.subcategorySlug,
    subcategoryName: subscription.subcategoryName,
    nestedSubcategorySlug: subscription.nestedSubcategorySlug || "",
    nestedSubcategoryName: subscription.nestedSubcategoryName || "",
  };
}

export function buildWishlistKey(subscription) {
  return [
    subscription.categoryId,
    subscription.subcategorySlug,
    subscription.nestedSubcategorySlug || "",
  ].join("::");
}

export function formatWishlistLabel(subscription) {
  return [
    subscription.categoryName,
    subscription.subcategoryName,
    subscription.nestedSubcategoryName,
  ]
    .filter(Boolean)
    .join(" / ");
}

export function isWishlistedSubscription(subscription, subscriptions) {
  const targetKey = buildWishlistKey(subscription);
  return subscriptions.some((entry) => buildWishlistKey(entry) === targetKey);
}

export async function fetchWishlistSubscriptions() {
  const response = await fetch(`${API_BASE_URL}/users/me/wishlist-subscriptions`, {
    credentials: "include",
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load wishlist subscriptions");
  }

  const subscriptions = await response.json();
  const normalized = Array.isArray(subscriptions)
    ? subscriptions.map(normalizeWishlistSubscription)
    : [];

  notifyWishlistChanged(normalized);
  return normalized;
}

export async function addWishlistSubscription(subscription) {
  const response = await fetch(`${API_BASE_URL}/users/me/wishlist-subscriptions`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizeWishlistSubscription(subscription)),
  });

  if (!response.ok) {
    throw new Error("Failed to save wishlist subscription");
  }

  const subscriptions = (await response.json()).map(normalizeWishlistSubscription);
  notifyWishlistChanged(subscriptions);
  return subscriptions;
}

export async function removeWishlistSubscription(subscription) {
  const response = await fetch(`${API_BASE_URL}/users/me/wishlist-subscriptions`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizeWishlistSubscription(subscription)),
  });

  if (!response.ok) {
    throw new Error("Failed to remove wishlist subscription");
  }

  const subscriptions = (await response.json()).map(normalizeWishlistSubscription);
  notifyWishlistChanged(subscriptions);
  return subscriptions;
}

export async function toggleWishlistSubscription(subscription, subscriptions = []) {
  if (isWishlistedSubscription(subscription, subscriptions)) {
    return removeWishlistSubscription(subscription);
  }

  return addWishlistSubscription(subscription);
}

export function subscribeToWishlist(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = (event) => {
    const subscriptions = event.detail?.subscriptions;
    callback(Array.isArray(subscriptions) ? subscriptions : []);
  };

  window.addEventListener(WISHLIST_EVENT, handleChange);

  return () => {
    window.removeEventListener(WISHLIST_EVENT, handleChange);
  };
}
