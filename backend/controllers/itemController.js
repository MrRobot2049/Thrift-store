const Item = require("../models/Item");

// CREATE ITEM
exports.createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      image,
      type,
    } = req.body;

    const item = await Item.create({
      title,
      description,
      price,
      category,
      image,
      type,
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
    const items = await Item.find()
      .populate("seller", "name email");

    res.json(items);
  } catch {
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
  } catch {
    res.status(500).json({ message: "Error fetching item" });
  }
};
