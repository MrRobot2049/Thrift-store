const User = require("../models/User");
const Item = require("../models/Item");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");

// return items the user is selling and auctions they have won
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user info
    const user = await User.findById(userId).select("-password");
    
    // Get items posted by user
    const items = await Item.find({ seller: userId });

    // Get auctions created by user
    const myAuctions = await Auction.find({ seller: userId })
      .populate("item")
      .populate("highestBidder", "name email")
      .populate("winner", "name email");

    // Get auctions won by user
    const wonAuctions = await Auction.find({ winner: userId })
      .populate("item")
      .populate("seller", "name email");

    // Get bids placed by user
    const myBids = await Bid.find({ bidder: userId })
      .populate("auction")
      .sort({ createdAt: -1 });

    res.json({
      user,
      itemsListed: items,
      auctionsCreated: myAuctions,
      wonAuctions,
      bidHistory: myBids,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// return bids placed by user (can be used to show purchases)
exports.getMyBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const bids = await Bid.find({ bidder: userId })
      .populate({
        path: "auction",
        populate: { path: "item" },
      });
    res.json(bids);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bids" });
  }
};

// items only
exports.getMyItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await Item.find({ seller: userId });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch items" });
  }
};
