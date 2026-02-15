const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startingPrice: {
      type: Number,
      required: true,
    },
    currentHighestBid: {
      type: Number,
      default: 0,
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    endTime: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);
