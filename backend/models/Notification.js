const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    type: {
      type: String,
      enum: ["auction_won", "subcategory_listing"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index(
  { user: 1, type: 1, auction: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "auction_won",
      auction: { $exists: true },
    },
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
