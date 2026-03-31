const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getMyChats,
  getAuctionChat,
  sendAuctionMessage,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/my", protect, getMyChats);
router.get("/auction/:auctionId", protect, getAuctionChat);
router.post("/auction/:auctionId/messages", protect, sendAuctionMessage);

module.exports = router;
