const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getMyChats,
  getAuctionChat,
  sendAuctionMessage,
  getPurchaseChat,
  sendPurchaseMessage,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/my", protect, getMyChats);
router.get("/auction/:auctionId", protect, getAuctionChat);
router.post("/auction/:auctionId/messages", protect, sendAuctionMessage);
router.get("/purchase/:purchaseId", protect, getPurchaseChat);
router.post("/purchase/:purchaseId/messages", protect, sendPurchaseMessage);

module.exports = router;
