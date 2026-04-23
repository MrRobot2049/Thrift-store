const Purchase = require("../models/Purchase");

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
