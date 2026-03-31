const jwt = require("jsonwebtoken");
const ChatMessage = require("../models/ChatMessage");
const ChatRoom = require("../models/ChatRoom");
const {
  getAuctionChatRoomForSocket,
  isUserParticipant,
} = require("../controllers/chatController");

function resolveToken(socket) {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization;

  if (authToken) {
    return authToken.startsWith("Bearer ") ? authToken.slice(7) : authToken;
  }

  if (header) {
    return header.startsWith("Bearer ") ? header.slice(7) : header;
  }

  return null;
}

function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = resolveToken(socket);
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id };
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user.id);
    socket.join(`user:${userId}`);

    socket.on("chat:joinAuction", async ({ auctionId }) => {
      try {
        const room = await getAuctionChatRoomForSocket(auctionId);

        if (!room || !isUserParticipant(room, userId)) {
          socket.emit("chat:error", { message: "Access denied" });
          return;
        }

        socket.join(`chat:${String(room._id)}`);
        socket.emit("chat:joined", {
          auctionId: String(room.auction),
          roomId: String(room._id),
        });
      } catch (err) {
        socket.emit("chat:error", { message: "Failed to join chat" });
      }
    });

    socket.on("chat:sendMessage", async ({ auctionId, text }) => {
      try {
        if (!text || !String(text).trim()) {
          socket.emit("chat:error", { message: "Message text is required" });
          return;
        }

        const room = await ChatRoom.findOne({ auction: auctionId, isEnabled: true });
        if (!room || !isUserParticipant(room, userId)) {
          socket.emit("chat:error", { message: "Access denied" });
          return;
        }

        const message = await ChatMessage.create({
          room: room._id,
          auction: room.auction,
          sender: userId,
          text: String(text).trim(),
        });

        await ChatRoom.findByIdAndUpdate(room._id, { lastMessageAt: new Date() });

        const populatedMessage = await ChatMessage.findById(message._id)
          .populate("sender", "name email");

        io.to(`chat:${String(room._id)}`).emit("chat:newMessage", populatedMessage);
      } catch (err) {
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });
  });
}

module.exports = registerChatSocket;
