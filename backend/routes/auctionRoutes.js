const express = require("express");
const {
  createAuction,
  getAuctions,
  getAuctionById,
  getMyAuctions,
  getAuctionsByItemId,
} = require("../controllers/auctionController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createAuction);
// Get my auctions (protected)
router.get("/mine", protect, getMyAuctions);
// Get auctions by item ID (query param)
router.get("/", (req, res, next) => {
  // If query param exists, handle it
  if (req.query.itemId) {
    return getAuctionsByItemId(req, res);
  }
  // Otherwise, get all auctions
  return getAuctions(req, res);
});
// single auction detail
router.get("/:id", getAuctionById);

module.exports = router;
