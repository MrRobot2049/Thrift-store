const express = require("express");
const {
  createItem,
  getAllItems,
  getItemById,
  getMyItems,
  deleteItem,
} = require("../controllers/itemController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create item (protected)
router.post("/", protect, createItem);

// Get items belonging to current user
router.get("/mine", protect, getMyItems);

// Get all items (public)
router.get("/", getAllItems);

// Get one item (public)
router.get("/:id", getItemById);

// Delete item (protected, seller only)
router.delete("/:id", protect, deleteItem);

module.exports = router;
