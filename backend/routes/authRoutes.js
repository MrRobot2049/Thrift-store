const express = require("express");
const {
  register,
  login,
  requestOtp,
  verifyOtp,
} = require("../controllers/authController");

const router = express.Router();

// Register
router.post("/register", register);
router.post("/register/request-otp", requestOtp);
router.post("/register/verify-otp", verifyOtp);

// Login
router.post("/login", login);

module.exports = router;
