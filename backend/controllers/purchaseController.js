const Purchase = require("../models/Purchase");
const Item = require("../models/Item");

// GET /api/purchases/mine — all purchases for logged-in user
exports.getMyPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ buyer: req.user.id })
      .sort({ createdAt: -1 })
      .populate("item", "image images");
    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch purchases" });
  }
};

// GET /api/purchases/item/:itemId/buyers — seller/admin view of buyers for a listing
exports.getItemBuyers = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId).select("seller title listingType");
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const isSeller = String(item.seller) === String(req.user.id);
    const isAdmin = (req.user.role || "user") === "admin";

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const purchases = await Purchase.find({ item: item._id, status: "confirmed" })
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });

    res.json({
      item: {
        _id: item._id,
        title: item.title,
        listingType: item.listingType,
      },
      purchases,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch item buyers" });
  }
};
