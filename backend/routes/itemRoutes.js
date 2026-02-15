const express = require("express");
const {
  createItem,
  getAllItems,
  getItemById,
} = require("../controllers/itemController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create item (protected)
router.post("/", protect, createItem);

// Get all items (public)
router.get("/", getAllItems);

// Get one item (public)
router.get("/:id", getItemById);

module.exports = router;
