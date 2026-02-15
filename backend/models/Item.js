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

    price: {
      type: Number,
      required: function () {
        return this.type === "fixed";
      },
    },

    category: {
      type: String,
      required: true,
    },

    image: {
      type: String, // will store Cloudinary URL later
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["fixed", "auction"],
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
