const express = require("express");
const { getMyProfile, getMyBids, getMyItems } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.get("/me/bids", protect, getMyBids);
router.get("/me/items", protect, getMyItems);

module.exports = router;
