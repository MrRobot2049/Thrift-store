const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");
const ChatMessage = require("../models/ChatMessage");
const Purchase = require("../models/Purchase");

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

async function getOrCreateRoomByPurchase(purchaseId) {
  if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
    return null;
  }

  let room = await ChatRoom.findOne({ purchase: purchaseId, isEnabled: true })
    .populate("seller", "name email")
    .populate("winner", "name email")
    .populate("item", "title image");

  if (room) {
    return room;
  }

  const purchase = await Purchase.findById(purchaseId)
    .populate("item", "title image seller")
    .populate("buyer", "name email");

  if (!purchase || !purchase.item || !purchase.item.seller || !purchase.buyer) {
    return null;
  }

  room = await ChatRoom.create({
    contextType: "purchase",
    purchase: purchase._id,
    item: purchase.item._id,
    seller: purchase.item.seller,
    winner: purchase.buyer._id,
    isEnabled: true,
    lastMessageAt: new Date(),
  });

  return ChatRoom.findById(room._id)
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
    const text = String(req.body?.text || "").trim();
    const image = String(req.body?.image || "").trim();

    if (!text && !image) {
      return res.status(400).json({ message: "Message text or image is required" });
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
      text,
      image,
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

exports.getPurchaseChat = async (req, res) => {
  try {
    const room = await getOrCreateRoomByPurchase(req.params.purchaseId);

    if (!room) {
      return res.status(404).json({ message: "Chat not available for this purchase" });
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

exports.sendPurchaseMessage = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const image = String(req.body?.image || "").trim();

    if (!text && !image) {
      return res.status(400).json({ message: "Message text or image is required" });
    }

    const room = await getOrCreateRoomByPurchase(req.params.purchaseId);

    if (!room) {
      return res.status(404).json({ message: "Chat not available for this purchase" });
    }

    if (!isParticipant(room, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await ChatMessage.create({
      room: room._id,
      purchase: room.purchase,
      sender: req.user.id,
      text,
      image,
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
exports.getPurchaseChatRoomForSocket = getOrCreateRoomByPurchase;
exports.isUserParticipant = isParticipant;
