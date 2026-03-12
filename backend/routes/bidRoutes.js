const express = require("express");
const { placeBid, getMyBids, getAuctionBids } = require("../controllers/bidController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Place bid
router.post("/", protect, placeBid);

// Get my bids (protected)
router.get("/my", protect, getMyBids);

// Get bids for a specific auction
router.get("/auction/:auctionId", getAuctionBids);

module.exports = router;
