const Item = require("../models/Item");
const Auction = require("../models/Auction");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const sendTicketEmail = require("../utils/sendTicketEmail");
const { notifyWishlistSubscribers } = require("../services/wishlistNotifications");
// CREATE ITEM (supports auction + merchandise/comedy/event/concert)
exports.createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      listingType,
      categoryId,
      subcategory,
      subcategorySlug,
      nestedSubcategory,
      nestedSubcategorySlug,
      image,
      images,
      askingPrice,
      biddingDuration,
      // Merchandise fields
      sizes,
      designVariation,
      quantity,
      // Event/Comedy/Concert fields
      venue,
      eventDate,
      headlineArtist,
      organizerContact,
      eventCapacity,
      vipExperience,
      ticketTiers,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description and category are required" });
    }

    // For auction type we still need an image
    const type = listingType || "auction";
    if (type === "auction" && !image) {
      return res.status(400).json({ message: "An image is required for auction items" });
    }

    const item = await Item.create({
      title,
      description,
      category,
      listingType: type,
      categoryId: categoryId || "",
      subcategory: subcategory || "",
      subcategorySlug: subcategorySlug || "",
      nestedSubcategory: nestedSubcategory || "",
      nestedSubcategorySlug: nestedSubcategorySlug || "",
      image: image || (Array.isArray(images) && images.length > 0 ? images[0] : ""),
      images: images || (image ? [image] : []),
      askingPrice: parseFloat(askingPrice) || 0,
      biddingDuration: parseInt(biddingDuration) || 24,
      seller: req.user.id,
      // Merchandise
      sizes: sizes || [],
      designVariation: designVariation || "",
      quantity: parseInt(quantity) || 0,
      // Event/Comedy/Concert
      venue: venue || "",
      eventDate: eventDate || "",
      headlineArtist: headlineArtist || "",
      organizerContact: organizerContact || "",
      eventCapacity: parseInt(eventCapacity) || 0,
      vipExperience: vipExperience || "",
      ticketTiers: ticketTiers || [],
    });

    // Only notify wishlist for auction items
    if (type === "auction") {
      await notifyWishlistSubscribers(item);
    }

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create item" });
  }
};

// GET ALL AUCTION ITEMS (home page — unchanged behaviour)
exports.getAllItems = async (req, res) => {
  try {
    const endedAuctions = await Auction.find({
      $or: [
        { isActive: false },
        { endTime: { $lt: new Date() } }
      ]
    }).select('item');

    const endedItemIds = endedAuctions.map(auction => auction.item);

    const items = await Item.find({
      _id: { $nin: endedItemIds },
      listingType: "auction",
    }).populate("seller", "name email");

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch items" });
  }
};

// GET MERCHANDISE ITEMS (merchandise page)
exports.getMerchandiseItems = async (req, res) => {
  try {
    const { type } = req.query; // optional filter: merchandise | comedy | event | concert
    const query = { listingType: { $in: ["merchandise", "comedy", "event", "concert"] } };
    if (type && ["merchandise", "comedy", "event", "concert"].includes(type)) {
      query.listingType = type;
    }
    const items = await Item.find(query)
      .populate("seller", "name email")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch merchandise items" });
  }
};

// GET SINGLE ITEM
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("seller", "name email");
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching item" });
  }
};

// GET USER'S ITEMS
exports.getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user.id }).populate("seller", "name email");
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your items" });
  }
};

// DELETE ITEM (seller only)
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.seller.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to delete this item" });
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
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.seller.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    const allowed = [
      "title","description","price","category","categoryId","subcategory",
      "subcategorySlug","nestedSubcategory","nestedSubcategorySlug","image","status",
      "sizes","designVariation","quantity","venue","eventDate","headlineArtist",
      "organizerContact","eventCapacity","vipExperience","ticketTiers",
    ];
    allowed.forEach(f => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update item" });
  }
};

// BUY ITEM DIRECTLY (non-auction listings only)
exports.buyItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.listingType === "auction") return res.status(400).json({ message: "Use auction flow for this item" });
    if (item.status === "sold") return res.status(400).json({ message: "This item is out of stock" });

    const { size, tierName, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);

    if (item.listingType === "merchandise") {
      if (size) {
        // Per-size stock check
        const sizeEntry = item.sizeInventory.find(s => s.size === size);
        if (!sizeEntry) return res.status(400).json({ message: `Size ${size} is not available` });
        if (sizeEntry.quantity < qty) return res.status(400).json({ message: `Only ${sizeEntry.quantity} unit(s) of size ${size} remaining` });
        sizeEntry.quantity -= qty;
        // Mark sold if all sizes exhausted
        const totalLeft = item.sizeInventory.reduce((acc, s) => acc + s.quantity, 0);
        if (totalLeft === 0) item.status = "sold";
      } else {
        // No-size merch (e.g. accessories)
        if (item.quantity < qty) return res.status(400).json({ message: `Only ${item.quantity} item(s) remaining` });
        item.quantity = Math.max(0, item.quantity - qty);
        if (item.quantity === 0) item.status = "sold";
      }

    } else if (["comedy", "concert"].includes(item.listingType)) {
      // Ticket tier purchase
      if (!tierName) return res.status(400).json({ message: "Please select a ticket tier" });
      const tier = item.ticketTiers.find(t => t.tierName === tierName);
      if (!tier) return res.status(400).json({ message: `Ticket tier "${tierName}" not found` });
      if (tier.quantity < qty) return res.status(400).json({ message: `Only ${tier.quantity} ticket(s) left for ${tierName}` });
      tier.quantity -= qty;
      const totalTickets = item.ticketTiers.reduce((acc, t) => acc + t.quantity, 0);
      if (totalTickets === 0) item.status = "sold";

    } else if (item.listingType === "event") {
      // Event registration slots
      const available = item.eventCapacity - (item.registeredCount || 0);
      if (available <= 0) return res.status(400).json({ message: "This event is fully registered" });
      if (available < qty) return res.status(400).json({ message: `Only ${available} spot(s) available` });
      item.registeredCount = (item.registeredCount || 0) + qty;
      if (item.registeredCount >= item.eventCapacity) item.status = "sold";

    } else {
      // Generic fallback
      if (item.quantity < qty) return res.status(400).json({ message: `Only ${item.quantity} remaining` });
      item.quantity = Math.max(0, item.quantity - qty);
      if (item.quantity === 0) item.status = "sold";
    }

    // ── Create Purchase Record ──
    const buyer = await User.findById(req.user.id);
    let unitPrice = item.askingPrice || 0;
    
    // For ticket tiers, use the tier price
    if (tierName && item.ticketTiers) {
      const tier = item.ticketTiers.find(t => t.tierName === tierName);
      if (tier) unitPrice = tier.price;
    }
    
    // For free events, ensure it's 0
    if (item.listingType === "event" && !item.askingPrice) unitPrice = 0;

    const totalPrice = unitPrice * qty;

    const purchase = new Purchase({
      buyer: req.user.id,
      item: item._id,
      itemTitle: item.title,
      listingType: item.listingType,
      tierName: tierName || "",
      size: size || "",
      quantity: qty,
      unitPrice,
      totalPrice,
      venue: item.venue || "",
      eventDate: item.eventDate || "",
      headlineArtist: item.headlineArtist || "",
      image: (item.images && item.images.length > 0) ? item.images[0] : (item.image || "")
    });

    await purchase.save();
    await item.save();

    // ── Send Email ──
    if (buyer && buyer.email) {
      // Don't await email so it doesn't block response
      sendTicketEmail(buyer.email, purchase).catch(console.error);
    }

    res.json({ message: "Purchase successful", item, purchase });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Purchase failed" });
  }
};


