const express = require("express");
const {
  getMyProfile,
  getMyBids,
  getMyItems,
  getMyWishlistSubscriptions,
  addWishlistSubscription,
  removeWishlistSubscription,
} = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.get("/me/bids", protect, getMyBids);
router.get("/me/items", protect, getMyItems);
router.get("/me/wishlist-subscriptions", protect, getMyWishlistSubscriptions);
router.post("/me/wishlist-subscriptions", protect, addWishlistSubscription);
router.delete("/me/wishlist-subscriptions", protect, removeWishlistSubscription);

module.exports = router;
