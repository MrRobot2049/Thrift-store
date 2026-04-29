const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIO } = require("../utils/socket");
const { sendMail } = require("../utils/email");

const DEFAULT_FRONTEND_URL = "https://thrift-store-ruby.vercel.app";

function doesSubscriptionMatchItem(subscription, item) {
  if (!subscription || !item) {
    return false;
  }

  if (
    subscription.categoryId !== item.categoryId ||
    subscription.subcategorySlug !== item.subcategorySlug
  ) {
    return false;
  }

  if (!subscription.nestedSubcategorySlug) {
    return true;
  }

  return subscription.nestedSubcategorySlug === item.nestedSubcategorySlug;
}

function buildItemPathLabel(item) {
  return [item.category, item.subcategory, item.nestedSubcategory]
    .filter(Boolean)
    .join(" / ");
}

function buildItemUrl(itemId) {
  const baseUrl = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/$/, "");
  return `${baseUrl}/items/${itemId}`;
}

async function sendWishlistEmail(user, item, seller) {
  const itemPath = buildItemPathLabel(item);
  const itemUrl = buildItemUrl(item._id);
  const lines = [
    `Hi ${user.name || "there"},`,
    "",
    `A new auction listing was posted in a subcategory you are watching: ${itemPath}.`,
    "",
    `Product: ${item.title}`,
    `Category Path: ${itemPath}`,
    `Starting Price: INR ${item.askingPrice}`,
    `Seller: ${seller?.name || "Unknown seller"}`,
    `Description: ${item.description || "No description provided."}`,
    `View Listing: ${itemUrl}`,
    "",
    "You are receiving this because you added this subcategory to your wishlist notifications.",
  ];

  await sendMail({
    to: user.email,
    subject: `New auction in ${itemPath}: ${item.title}`,
    text: lines.join("\n"),
  });
}

async function notifyWishlistSubscribers(item) {
  const watchers = await User.find({
    _id: { $ne: item.seller },
    wishlistSubscriptions: { $exists: true, $ne: [] },
  }).select("_id name email wishlistSubscriptions");

  const matchingUsers = watchers.filter((user) =>
    user.wishlistSubscriptions.some((subscription) =>
      doesSubscriptionMatchItem(subscription, item)
    )
  );

  if (matchingUsers.length === 0) {
    return;
  }

  const message = `New listing in ${buildItemPathLabel(item)}: ${item.title}`;
  const seller = await User.findById(item.seller).select("name email");

  const notifications = await Notification.insertMany(
    matchingUsers.map((user) => ({
      user: user._id,
      // Preserve uniqueness compatibility with older databases that may still
      // have the original unique index on { user, type, auction }.
      auction: item._id,
      item: item._id,
      type: "subcategory_listing",
      message,
    }))
  );

  await Promise.all(
    matchingUsers.map(async (user) => {
      try {
        await sendWishlistEmail(user, item, seller);
      } catch (error) {
        console.error(`Failed to send wishlist email to ${user.email}:`, error.message);
      }
    })
  );

  const io = getIO();
  if (!io) {
    return;
  }

  notifications.forEach((notification) => {
    io.to(`user:${String(notification.user)}`).emit("notification:new", {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      item: {
        _id: item._id,
        title: item.title,
        image: item.image,
      },
      createdAt: notification.createdAt,
      isRead: notification.isRead,
    });
  });
}

module.exports = {
  notifyWishlistSubscribers,
};
