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

connectDB();

const allowedCorsOrigins = [
  "http://localhost:3000",
  "https://thrift-store-ruby.vercel.app",
];

app.use(cors({
  origin: allowedCorsOrigins,
  credentials: true,
}));

app.options("/{*splat}", cors());

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
    maxAge: 60 * 60 * 1000,
  },
}));

app.use(express.json());
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT;

const io = new Server(server, {
  cors: {
    origin: allowedCorsOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

setIO(io);
registerChatSocket(io);

console.log("ENV PORT:", process.env.PORT);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setInterval(() => {
    closeExpiredAuctions();
  }, 60 * 1000);
});
