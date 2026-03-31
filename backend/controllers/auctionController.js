const Auction = require("../models/Auction");
const Item = require("../models/Item");
const { closeAuctionIfExpired, closeExpiredAuctions } = require("../services/auctionLifecycle");

// CREATE AUCTION
exports.createAuction = async (req, res) => {
  try {
    const { itemId, startingPrice, endTime } = req.body;

    // Check item exists
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if auction already exists for this item
    const existingAuction = await Auction.findOne({ item: itemId });
    if (existingAuction) {
      return res.status(400).json({ message: "Auction already exists for this item" });
    }

    const auction = await Auction.create({
      item: itemId,
      seller: item.seller, // Set seller to item's seller
      startingPrice,
      currentHighestBid: 0,
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
      .populate("seller", "name email")
      .populate("highestBidder", "name email")
      .populate("winner", "name email");

    // close any expired auctions before returning
    await Promise.all(auctions.map(closeAuctionIfExpired));

    res.json(auctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch auctions" });
  }
};

// GET SINGLE AUCTION
exports.getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate("item")
      .populate("seller", "name email")
      .populate("highestBidder", "name email")
      .populate("winner", "name email");

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    await closeAuctionIfExpired(auction);

    res.json(auction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching auction" });
  }
};

// GET AUCTIONS BY ITEM ID
exports.getAuctionsByItemId = async (req, res) => {
  try {
    const { itemId } = req.query;

    if (!itemId) {
      return res.status(400).json({ message: "itemId parameter required" });
    }

    const auctions = await Auction.find({ item: itemId })
      .populate("item")
      .populate("seller", "name email")
      .populate("highestBidder", "name email")
      .populate("winner", "name email");

    // close any expired auctions before returning
    await Promise.all(auctions.map(closeAuctionIfExpired));

    res.json(auctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch auctions" });
  }
};

// optionally expose a periodic close task
exports.closeExpiredAuctions = closeExpiredAuctions;

// GET USER'S AUCTIONS
exports.getMyAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.user.id })
      .populate("item")
      .populate("highestBidder", "name email")
      .populate("winner", "name email");

    res.json(auctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your auctions" });
  }
};
