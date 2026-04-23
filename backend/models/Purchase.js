const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    buyer:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    item:          { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    itemTitle:     { type: String, required: true },
    listingType:   { type: String, default: "merchandise" },
    tierName:      { type: String, default: "" },
    size:          { type: String, default: "" },
    quantity:      { type: Number, default: 1 },
    unitPrice:     { type: Number, default: 0 },
    totalPrice:    { type: Number, default: 0 },
    venue:         { type: String, default: "" },
    eventDate:     { type: String, default: "" },
    headlineArtist:{ type: String, default: "" },
    image:         { type: String, default: "" },
    // Unique ticket reference
    ticketId: {
      type: String,
      default: () => `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
