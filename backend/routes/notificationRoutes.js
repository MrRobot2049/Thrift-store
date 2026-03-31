const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/me", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationRead);
router.patch("/me/read-all", protect, markAllNotificationsRead);

module.exports = router;
