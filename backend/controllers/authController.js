const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const COLLEGE_DOMAIN = "@iitrpr.ac.in";
const OTP_EXPIRY_MINUTES = 10;

const isCollegeEmail = (email = "") =>
  email.toLowerCase().endsWith(COLLEGE_DOMAIN);

const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are missing in environment variables.");
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOtpEmail = async (email, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Thrift Store OTP Verification",
    text: `Your OTP is ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
  });
};

// REQUEST OTP FOR REGISTRATION
exports.requestOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (!isCollegeEmail(email)) {
      return res.status(400).json({
        message: `Only ${COLLEGE_DOMAIN} emails are allowed`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otpCode = otp;
      existingUser.otpExpiresAt = otpExpiresAt;
      await existingUser.save();
    } else {
      await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        isVerified: false,
        otpCode: otp,
        otpExpiresAt,
      });
    }

    await sendOtpEmail(email.toLowerCase(), otp);

    return res.status(200).json({
      message: "OTP sent to your college email",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not send OTP email" });
  }
};

// VERIFY OTP AND COMPLETE REGISTRATION
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "User not found. Request OTP first." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified. Please login." });
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP not requested. Request OTP first." });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP has expired. Request a new OTP." });
    }

    if (user.otpCode !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    return res.status(200).json({ message: "Registration successful. You can now login." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// REGISTER USER
exports.register = async (req, res) => {
  return exports.requestOtp(req, res);
};

// LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email with OTP before login" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create session
    req.session.userId = user._id;

    // Keep returning token for backward compatibility
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT USER
exports.logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
