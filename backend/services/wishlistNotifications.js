const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIO } = require("../utils/socket");

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

async function notifyWishlistSubscribers(item) {
  const watchers = await User.find({
    _id: { $ne: item.seller },
    wishlistSubscriptions: { $exists: true, $ne: [] },
  }).select("_id wishlistSubscriptions");

  const matchingUsers = watchers.filter((user) =>
    user.wishlistSubscriptions.some((subscription) =>
      doesSubscriptionMatchItem(subscription, item)
    )
  );

  if (matchingUsers.length === 0) {
    return;
  }

  const message = `New listing in ${buildItemPathLabel(item)}: ${item.title}`;

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
