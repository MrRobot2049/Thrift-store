const express = require("express");
const {
  createItem,
  getAllItems,
  getMerchandiseItems,
  getItemById,
  getMyItems,
  deleteItem,
  buyItem,
} = require("../controllers/itemController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create item (protected)
router.post("/", protect, createItem);

// Get merchandise/event items (public) — must be BEFORE /:id
router.get("/merchandise", getMerchandiseItems);

// Get items belonging to current user
router.get("/mine", protect, getMyItems);

// Get all auction items (public)
router.get("/", getAllItems);

// Get one item (public)
router.get("/:id", getItemById);

// Buy item directly (non-auction, protected)
router.post("/:id/buy", protect, buyItem);

// Delete item (protected, seller only)
router.delete("/:id", protect, deleteItem);

module.exports = router;
