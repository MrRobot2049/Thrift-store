const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    contextType: {
      type: String,
      enum: ["auction", "purchase"],
      default: "auction",
    },
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: false,
      unique: true,
      sparse: true,
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: false,
      unique: true,
      sparse: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
