const Item = require("../models/Item");
const Auction = require("../models/Auction");

// CREATE ITEM (Auction only)
exports.createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      image,
      images,
      askingPrice,
      biddingDuration,
    } = req.body;

    if (!title || !description || !category || !image || !askingPrice || !biddingDuration) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const item = await Item.create({
      title,
      description,
      category,
      image,
      images: images || [image],
      askingPrice: parseFloat(askingPrice),
      biddingDuration: parseInt(biddingDuration),
      seller: req.user.id,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create item" });
  }
};

// GET ALL ITEMS
exports.getAllItems = async (req, res) => {
  try {
    // Find all auctions that are either inactive or have ended
    const endedAuctions = await Auction.find({
      $or: [
        { isActive: false },
        { endTime: { $lt: new Date() } }
      ]
    }).select('item');

    // Get item IDs that have ended auctions
    const endedItemIds = endedAuctions.map(auction => auction.item);

    // Find items that don't have ended auctions
    const items = await Item.find({
      _id: { $nin: endedItemIds }
    }).populate("seller", "name email");

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch items" });
  }
};

// GET SINGLE ITEM
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("seller", "name email");

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching item" });
  }
};

// GET USER'S ITEMS
exports.getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user.id })
      .populate("seller", "name email");

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your items" });
  }
};

// DELETE ITEM (only by seller)
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this item" });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete item" });
  }
};

// UPDATE ITEM (seller only)
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // allow updating a few fields
    const updates = ["title", "description", "price", "category", "image", "status"];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update item" });
  }
};

// ITEMS BELONGING TO CURRENT USER
exports.getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user.id });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your items" });
  }
};
