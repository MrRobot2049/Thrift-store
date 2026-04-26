require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const itemRoutes = require("./routes/itemRoutes");

const auctionRoutes = require("./routes/auctionRoutes");
const bidRoutes = require("./routes/bidRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { closeExpiredAuctions } = require("./controllers/auctionController");
const { setIO } = require("./utils/socket");
const registerChatSocket = require("./socket/chatSocket");

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

// Connect to DB
connectDB();

const normalizeOrigin = (origin = "") => origin.replace(/\/$/, "");
const defaultDevOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const defaultProdOrigins = [
  "https://thrift-store-ruby.vercel.app",
];
const allowedOrigins = new Set(
  [...defaultDevOrigins, ...defaultProdOrigins, process.env.FRONTEND_URL]
    .filter(Boolean)
    .map(normalizeOrigin)
);

// CORS (needed for cookies from frontend)
const corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, server-to-server, React proxy)
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);

    // Allow any localhost/127.0.0.1 origin (any port — covers React dev server & proxy)
    if (
      normalizedOrigin.startsWith("http://localhost") ||
      normalizedOrigin.startsWith("http://127.0.0.1") ||
      allowedOrigins.has(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    console.warn("Blocked by CORS:", normalizedOrigin);
    return callback(null, false);

  },
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Session configuration (stored in MongoDB)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000, // 1 hour
  },
}));

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
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reports", reportRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ── Global JSON error handler (must be last, after all routes) ──
// Without this, Express's default handler returns HTML, which breaks JSON.parse in the browser.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    credentials: true,
    methods: ["GET", "POST"],
  },
});

setIO(io);
registerChatSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // start background timer to close auctions every minute
  setInterval(() => {
    closeExpiredAuctions();
  }, 60 * 1000);
});
