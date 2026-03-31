const Auction = require("../models/Auction");
const Item = require("../models/Item");
const Notification = require("../models/Notification");
const ChatRoom = require("../models/ChatRoom");
const { getIO } = require("../utils/socket");

async function notifyWinnerAndEnableChat(auction) {
  if (!auction.winner) {
    return;
  }

  const message = `Congratulations! You won the auction for ${auction.item?.title || "an item"}.`;

  const [notification, room] = await Promise.all([
    Notification.findOneAndUpdate(
      {
        user: auction.winner,
        type: "auction_won",
        auction: auction._id,
      },
      {
        $setOnInsert: {
          item: auction.item?._id || auction.item,
          message,
          isRead: false,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
      }
    ),
    ChatRoom.findOneAndUpdate(
      { auction: auction._id },
      {
        $set: {
          item: auction.item?._id || auction.item,
          seller: auction.seller,
          winner: auction.winner,
          isEnabled: true,
        },
        $setOnInsert: {
          lastMessageAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        upsert: true,
      }
    ),
  ]);

  auction.winnerNotified = true;
  auction.chatRoom = room._id;
  await auction.save();

  const io = getIO();
  if (io) {
    io.to(`user:${String(auction.winner)}`).emit("notification:new", {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      auction: notification.auction,
      item: notification.item,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
    });

    io.to(`user:${String(auction.seller)}`).emit("chat:enabled", {
      auctionId: String(auction._id),
      roomId: String(room._id),
    });

    io.to(`user:${String(auction.winner)}`).emit("chat:enabled", {
      auctionId: String(auction._id),
      roomId: String(room._id),
    });
  }
}

async function closeAuctionIfExpired(auction) {
  if (!auction) {
    return auction;
  }

  // Backfill for auctions that already ended before chat/notification logic was introduced.
  if (!auction.isActive) {
    if (auction.winner && (!auction.winnerNotified || !auction.chatRoom)) {
      await auction.populate("item", "title");
      await notifyWinnerAndEnableChat(auction);
    }
    return auction;
  }

  if (new Date() <= auction.endTime) {
    return auction;
  }

  auction.isActive = false;
  auction.winner = auction.highestBidder || null;
  auction.soldPrice = auction.currentHighestBid || null;

  await auction.populate("item", "title");
  await auction.save();

  const itemStatus = auction.winner ? "sold" : "ended";
  await Item.findByIdAndUpdate(auction.item._id || auction.item, { status: itemStatus });

  if (auction.winner && !auction.winnerNotified) {
    await notifyWinnerAndEnableChat(auction);
  }

  return auction;
}

async function closeExpiredAuctions() {
  try {
    const auctions = await Auction.find({
      $or: [
        { isActive: true, endTime: { $lt: new Date() } },
        { isActive: false, winner: { $ne: null }, $or: [{ winnerNotified: false }, { chatRoom: { $exists: false } }, { chatRoom: null }] },
      ],
    })
      .populate("item", "title");

    for (const auction of auctions) {
      await closeAuctionIfExpired(auction);
    }
  } catch (err) {
    console.error("Error closing auctions", err);
  }
}

module.exports = {
  closeAuctionIfExpired,
  closeExpiredAuctions,
};
