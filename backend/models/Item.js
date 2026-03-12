const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    image: {
      type: String, // Cloudinary URL
      required: true,
    },

    images: {
      type : [String],
      default: [],
    },

    askingPrice: {
      type: Number,
      required: true,
    },

    biddingDuration: {
      type: Number, // in hours
      required: true,
      default: 24,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "sold", "ended"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
