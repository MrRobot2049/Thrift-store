const Auction = require("../models/Auction");
const Item = require("../models/Item");

// CREATE AUCTION
exports.createAuction = async (req, res) => {
  try {
    const { itemId, startingPrice, endTime } = req.body;

    // Check item exists
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only seller can auction
    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const auction = await Auction.create({
      item: itemId,
      seller: req.user.id,
      startingPrice,
      currentHighestBid: startingPrice,
      endTime,
    });

    res.status(201).json(auction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create auction" });
  }
};

// GET ALL AUCTIONS
exports.getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate("item")
      .populate("seller", "name email");

    res.json(auctions);
  } catch {
    res.status(500).json({ message: "Failed to fetch auctions" });
  }
};
