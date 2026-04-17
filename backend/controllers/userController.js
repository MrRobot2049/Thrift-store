const User = require("../models/User");
const Item = require("../models/Item");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");

const normalizeSubscriptionPayload = (payload = {}) => ({
  categoryId: String(payload.categoryId || "").trim(),
  categoryName: String(payload.categoryName || "").trim(),
  subcategorySlug: String(payload.subcategorySlug || "").trim(),
  subcategoryName: String(payload.subcategoryName || "").trim(),
  nestedSubcategorySlug: String(payload.nestedSubcategorySlug || "").trim(),
  nestedSubcategoryName: String(payload.nestedSubcategoryName || "").trim(),
});

const isSameSubscription = (left, right) =>
  left.categoryId === right.categoryId &&
  left.subcategorySlug === right.subcategorySlug &&
  (left.nestedSubcategorySlug || "") === (right.nestedSubcategorySlug || "");

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
      .populate({
        path: "auction",
        populate: { path: "item" },
      })
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

exports.getMyWishlistSubscriptions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("wishlistSubscriptions");
    res.json(user?.wishlistSubscriptions || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch wishlist subscriptions" });
  }
};

exports.addWishlistSubscription = async (req, res) => {
  try {
    const subscription = normalizeSubscriptionPayload(req.body);

    if (
      !subscription.categoryId ||
      !subscription.categoryName ||
      !subscription.subcategorySlug ||
      !subscription.subcategoryName
    ) {
      return res.status(400).json({ message: "Category and subcategory are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyExists = user.wishlistSubscriptions.some((entry) =>
      isSameSubscription(entry, subscription)
    );

    if (!alreadyExists) {
      user.wishlistSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json(user.wishlistSubscriptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save wishlist subscription" });
  }
};

exports.removeWishlistSubscription = async (req, res) => {
  try {
    const subscription = normalizeSubscriptionPayload(req.body);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlistSubscriptions = user.wishlistSubscriptions.filter(
      (entry) => !isSameSubscription(entry, subscription)
    );

    await user.save();

    res.json(user.wishlistSubscriptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove wishlist subscription" });
  }
};
