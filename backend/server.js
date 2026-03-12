require("dotenv").config();
const express = require("express");
const cors = require("cors");


const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const itemRoutes = require("./routes/itemRoutes");

const auctionRoutes = require("./routes/auctionRoutes");
const bidRoutes = require("./routes/bidRoutes");
const userRoutes = require("./routes/userRoutes");
const { closeExpiredAuctions } = require("./controllers/auctionController");

const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});


// Routes
app.use("/api/auth", authRoutes);

app.use("/api/items", itemRoutes);

app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/users", userRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // start background timer to close auctions every minute
  setInterval(() => {
    closeExpiredAuctions();
  }, 60 * 1000);
});
