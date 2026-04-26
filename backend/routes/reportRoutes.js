const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createReport,
  getAdminReports,
  reviewReport,
} = require("../controllers/reportController");

const router = express.Router();

router.post("/", protect, createReport);
router.get("/admin", protect, getAdminReports);
router.patch("/:reportId/review", protect, reviewReport);

module.exports = router;
