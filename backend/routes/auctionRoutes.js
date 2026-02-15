const express = require("express");
const {
  createAuction,
  getAuctions,
} = require("../controllers/auctionController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createAuction);
router.get("/", getAuctions);

module.exports = router;
