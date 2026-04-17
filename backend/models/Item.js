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

    categoryId: {
      type: String,
      required: true,
      trim: true,
    },

    subcategory: {
      type: String,
      required: true,
      trim: true,
    },

    subcategorySlug: {
      type: String,
      required: true,
      trim: true,
    },

    nestedSubcategory: {
      type: String,
      default: "",
      trim: true,
    },

    nestedSubcategorySlug: {
      type: String,
      default: "",
      trim: true,
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
      type: Number, 
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
