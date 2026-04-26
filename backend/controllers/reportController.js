const Item = require("../models/Item");
const User = require("../models/User");
const Auction = require("../models/Auction");
const Report = require("../models/Report");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

const REASON_LABELS = {
  spam: "Spam",
  inappropriate_content: "Inappropriate Content",
  inaccurate_listing: "Inaccurate Listing",
};

function getTopReason(reasonCounts) {
  return Object.entries(reasonCounts || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "spam";
}

function toObjectIdString(value) {
  if (!value) {
    return "";
  }

  const raw = typeof value === "object" && value._id ? value._id : value;
  if (!mongoose.Types.ObjectId.isValid(raw)) {
    return "";
  }

  return String(raw);
}

async function isAdminUser(reqUser) {
  const userId = toObjectIdString(reqUser?.id);
  if (!userId) {
    return false;
  }

  if ((reqUser.role || "user") === "admin") {
    return true;
  }

  const user = await User.findById(userId).select("role");
  return Boolean(user && user.role === "admin");
}

exports.createReport = async (req, res) => {
  try {
    const { itemId, reason, details = "" } = req.body;

    if (!itemId || !reason) {
      return res.status(400).json({ message: "Item and reason are required" });
    }

    if (!Object.prototype.hasOwnProperty.call(REASON_LABELS, reason)) {
      return res.status(400).json({ message: "Invalid report reason" });
    }

    const item = await Item.findById(itemId).select("title seller listingType");
    if (!item) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (String(item.seller) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot report your own listing" });
    }

    const existingPending = await Report.findOne({
      item: item._id,
      reporter: req.user.id,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({ message: "You already reported this listing from this account" });
    }

    const report = await Report.create({
      item: item._id,
      reporter: req.user.id,
      reason,
      details: String(details || "").trim(),
    });

    const admins = await User.find({ role: "admin" }).select("_id");

    if (admins.length > 0) {
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        item: item._id,
        report: report._id,
        type: "listing_report",
        message: `New listing report (${REASON_LABELS[reason]}) for "${item.title}"`,
      }));

      await Notification.insertMany(adminNotifications, { ordered: false });
    }

    const populated = await Report.findById(report._id)
      .populate("item", "_id title listingType")
      .populate("reporter", "_id name email");

    res.status(201).json(populated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "You already reported this listing from this account" });
    }

    console.error(err);
    res.status(500).json({ message: "Failed to submit report" });
  }
};

exports.getAdminReports = async (req, res) => {
  try {
    const isAdmin = await isAdminUser(req.user);
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const status = req.query.status;
    const query = {};

    if (status === "pending" || status === "resolved") {
      query.status = status;
    } else if (status !== "all" && status !== undefined) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(600)
      .lean();

    const itemIds = [...new Set(reports.map((entry) => toObjectIdString(entry.item)).filter(Boolean))];
    const reporterIds = [...new Set(reports.map((entry) => toObjectIdString(entry.reporter)).filter(Boolean))];
    const reviewerIds = [...new Set(reports.map((entry) => toObjectIdString(entry.reviewedBy)).filter(Boolean))];

    const [items, reporters, reviewers] = await Promise.all([
      Item.find({ _id: { $in: itemIds } })
        .select("_id title category subcategory nestedSubcategory listingType image seller status")
        .lean(),
      User.find({ _id: { $in: reporterIds } }).select("_id name email").lean(),
      User.find({ _id: { $in: reviewerIds } }).select("_id name email").lean(),
    ]);

    const itemMap = new Map(items.map((entry) => [String(entry._id), entry]));
    const reporterMap = new Map(reporters.map((entry) => [String(entry._id), entry]));
    const reviewerMap = new Map(reviewers.map((entry) => [String(entry._id), entry]));

    const grouped = new Map();

    reports.forEach((entry) => {
      const itemId = toObjectIdString(entry.item);
      if (!itemId) {
        return;
      }

      const groupKey = `${itemId}:${entry.status}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          _id: groupKey,
          actionReportId: String(entry._id),
          itemId,
          item: itemMap.get(itemId) || null,
          status: entry.status,
          resolution: entry.resolution,
          createdAt: entry.createdAt,
          reviewedAt: entry.reviewedAt || null,
          reviewedBy: toObjectIdString(entry.reviewedBy)
            ? reviewerMap.get(toObjectIdString(entry.reviewedBy)) || null
            : null,
          reportCount: 0,
          reasonCounts: {
            spam: 0,
            inappropriate_content: 0,
            inaccurate_listing: 0,
          },
          reasonSummary: [],
          primaryReason: entry.reason,
          details: [],
          reporters: [],
        });
      }

      const group = grouped.get(groupKey);
      group.reportCount += 1;
      if (Object.prototype.hasOwnProperty.call(group.reasonCounts, entry.reason)) {
        group.reasonCounts[entry.reason] += 1;
      }

      if (entry.createdAt && new Date(entry.createdAt) > new Date(group.createdAt)) {
        group.createdAt = entry.createdAt;
      }

      if (entry.reviewedAt && (!group.reviewedAt || new Date(entry.reviewedAt) > new Date(group.reviewedAt))) {
        group.reviewedAt = entry.reviewedAt;
        const reviewedById = toObjectIdString(entry.reviewedBy);
        group.reviewedBy = reviewedById
          ? reviewerMap.get(reviewedById) || group.reviewedBy
          : group.reviewedBy;
      }

      if (entry.details && group.details.length < 5) {
        group.details.push(entry.details);
      }

      const reporterId = toObjectIdString(entry.reporter);
      const reporter = reporterMap.get(reporterId);
      if (reporter && !group.reporters.some((value) => String(value._id) === reporterId)) {
        group.reporters.push(reporter);
      }
    });

    const response = [...grouped.values()]
      .map((group) => {
        const primaryReason = getTopReason(group.reasonCounts);
        const reasonSummary = Object.entries(group.reasonCounts)
          .filter(([, count]) => count > 0)
          .map(([reason, count]) => ({
            reason,
            label: REASON_LABELS[reason] || reason,
            count,
          }))
          .sort((a, b) => b.count - a.count);

        return {
          ...group,
          primaryReason,
          reasonSummary,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

exports.reviewReport = async (req, res) => {
  try {
    const isAdmin = await isAdminUser(req.user);
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.reportId)) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const { action } = req.body;
    if (!["removed", "dismissed"].includes(action)) {
      return res.status(400).json({ message: "Invalid review action" });
    }

    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const pendingReports = await Report.find({
      item: report.item,
      status: "pending",
    }).select("_id reason");

    if (pendingReports.length === 0) {
      return res.status(400).json({ message: "No pending reports found for this listing" });
    }

    const reasonCounts = pendingReports.reduce(
      (acc, entry) => {
        if (Object.prototype.hasOwnProperty.call(acc, entry.reason)) {
          acc[entry.reason] += 1;
        }
        return acc;
      },
      {
        spam: 0,
        inappropriate_content: 0,
        inaccurate_listing: 0,
      }
    );

    const topReason = getTopReason(reasonCounts);
    const reportCount = pendingReports.length;

    if (action === "removed") {
      const itemDoc = await Item.findById(report.item).select("_id title seller");

      if (itemDoc) {
        await Item.findByIdAndDelete(report.item);
        await Auction.deleteMany({ item: report.item });

        if (itemDoc.seller) {
          const reasonLabel = REASON_LABELS[topReason] || "Policy Violation";
          const reporterSummary = reportCount > 1 ? ` (${reportCount} users reported)` : "";
          try {
            await Notification.create({
              user: itemDoc.seller,
              // Keep compatibility with older unique index on { user, type, auction }.
              auction: itemDoc._id,
              item: itemDoc._id,
              type: "listing_removed",
              message: `Your listing "${itemDoc.title}" was removed due to ${reasonLabel}.${reporterSummary}`,
            });
          } catch (notificationError) {
            if (notificationError?.code !== 11000) {
              throw notificationError;
            }
          }
        }
      }

      await Report.updateMany(
        { item: report.item, status: "pending" },
        {
          status: "resolved",
          resolution: "removed",
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        }
      );

      const updatedReport = await Report.findById(report._id)
        .populate("item", "_id title category subcategory nestedSubcategory listingType image seller status")
        .populate("reporter", "_id name email")
        .populate("reviewedBy", "_id name email");

      return res.json({
        message: "Listing removed and reports resolved",
        report: updatedReport,
        resolvedCount: reportCount,
      });
    }

    await Report.updateMany(
      { item: report.item, status: "pending" },
      {
        status: "resolved",
        resolution: "dismissed",
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      }
    );

    const updatedReport = await Report.findById(report._id)
      .populate("item", "_id title category subcategory nestedSubcategory listingType image seller status")
      .populate("reporter", "_id name email")
      .populate("reviewedBy", "_id name email");

    res.json({
      message: "Reports dismissed",
      report: updatedReport,
      resolvedCount: reportCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to review report" });
  }
};
