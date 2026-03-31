const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");
const ChatMessage = require("../models/ChatMessage");

const toIdString = (value) => String(value?._id || value || "");

const isParticipant = (room, userId) =>
  toIdString(room.seller) === String(userId) || toIdString(room.winner) === String(userId);

async function getRoomByAuction(auctionId) {
  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    return null;
  }
  return ChatRoom.findOne({ auction: auctionId, isEnabled: true })
    .populate("seller", "name email")
    .populate("winner", "name email")
    .populate("item", "title image");
}

exports.getMyChats = async (req, res) => {
  try {
    const chats = await ChatRoom.find({
      isEnabled: true,
      $or: [{ seller: req.user.id }, { winner: req.user.id }],
    })
      .populate("item", "title image")
      .populate("seller", "name email")
      .populate("winner", "name email")
      .sort({ lastMessageAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
};

exports.getAuctionChat = async (req, res) => {
  try {
    const room = await getRoomByAuction(req.params.auctionId);

    if (!room) {
      return res.status(404).json({ message: "Chat not available for this auction" });
    }

    if (!isParticipant(room, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await ChatMessage.find({ room: room._id })
      .populate("sender", "name email")
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ room, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch chat" });
  }
};

exports.sendAuctionMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const room = await getRoomByAuction(req.params.auctionId);

    if (!room) {
      return res.status(404).json({ message: "Chat not available for this auction" });
    }

    if (!isParticipant(room, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await ChatMessage.create({
      room: room._id,
      auction: room.auction,
      sender: req.user.id,
      text: String(text).trim(),
    });

    await ChatRoom.findByIdAndUpdate(room._id, { lastMessageAt: new Date() });

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate("sender", "name email");

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

exports.getAuctionChatRoomForSocket = getRoomByAuction;
exports.isUserParticipant = isParticipant;
