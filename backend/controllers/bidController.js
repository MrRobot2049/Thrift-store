const Bid = require("../models/Bid");
const Auction = require("../models/Auction");

// PLACE BID
exports.placeBid = async (req, res) => {
  try {
    const { auctionId, amount } = req.body;

    const auction = await Auction.findById(auctionId);

    if (!auction || !auction.isActive) {
      return res.status(400).json({ message: "Auction not active" });
    }

    if (new Date() > auction.endTime) {
      auction.isActive = false;
      auction.winner = auction.highestBidder;
      auction.soldPrice = auction.currentHighestBid;
      await auction.save();

      return res.status(400).json({ message: "Auction ended" });
    }

    // For first bid (currentHighestBid is 0), must be >= starting price
    // For subsequent bids, must be > current highest bid
    let minimumBid;
    if (auction.currentHighestBid === 0) {
      minimumBid = auction.startingPrice;
    } else {
      minimumBid = auction.currentHighestBid + 1;
    }

    if (amount < minimumBid) {
      return res.status(400).json({ 
        message: `Bid must be at least ₹${minimumBid}`
      });
    }

    const bid = await Bid.create({
      auction: auctionId,
      bidder: req.user.id,
      amount,
    });

    auction.currentHighestBid = amount;
    auction.highestBidder = req.user.id;

    await auction.save();

    res.status(201).json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Bid failed" });
  }
};

// GET BIDS FOR AN AUCTION
exports.getAuctionBids = async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .populate("bidder", "name email")
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bids" });
  }
};

// GET USER'S BIDS
exports.getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.id })
      .populate("auction")
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your bids" });
  }
};
