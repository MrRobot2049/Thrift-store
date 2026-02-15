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
      await auction.save();

      return res.status(400).json({ message: "Auction ended" });
    }

    if (amount <= auction.currentHighestBid) {
      return res
        .status(400)
        .json({ message: "Bid too low" });
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
