const mongoose = require("mongoose");

const ticketTierSchema = new mongoose.Schema({
  tierName: { type: String },
  quantity: { type: Number },
  price: { type: Number },
}, { _id: false });

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

    // listingType distinguishes auction items from merchandise/events
    listingType: {
      type: String,
      enum: ["auction", "merchandise", "comedy", "event", "concert"],
      default: "auction",
    },

    categoryId: {
      type: String,
      default: "",
      trim: true,
    },

    subcategory: {
      type: String,
      default: "",
      trim: true,
    },

    subcategorySlug: {
      type: String,
      default: "",
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
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    askingPrice: {
      type: Number,
      default: 0,
    },

    biddingDuration: {
      type: Number,
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

    // ── Merchandise-specific fields ──
    // sizeInventory holds per-size stock: [{ size: "S", quantity: 20 }, ...]
    sizeInventory: {
      type: [{ size: String, quantity: { type: Number, default: 0 } }],
      default: [],
    },
    // Keep sizes[] as a derived list (populated on save for backward compat)
    sizes: {
      type: [String],
      default: [],
    },
    designVariation: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      default: 0,
    },

    // ── Comedy / Event / Concert ──
    venue: { type: String, default: "" },
    eventDate: { type: String, default: "" },
    headlineArtist: { type: String, default: "" },
    organizerContact: { type: String, default: "" },
    eventCapacity: { type: Number, default: 0 },
    vipExperience: { type: String, default: "" },
    ticketTiers: {
      type: [ticketTierSchema],
      default: [],
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
