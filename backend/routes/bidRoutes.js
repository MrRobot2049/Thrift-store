const express = require("express");
const { placeBid } = require("../controllers/bidController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, placeBid);

module.exports = router;
