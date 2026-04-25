const express = require("express");
const { getMyPurchases, getItemBuyers } = require("../controllers/purchaseController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/mine", protect, getMyPurchases);
router.get("/item/:itemId/buyers", protect, getItemBuyers);

module.exports = router;
