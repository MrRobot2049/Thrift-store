const express = require("express");
const { getMyPurchases } = require("../controllers/purchaseController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/mine", protect, getMyPurchases);

module.exports = router;
