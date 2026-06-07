import { Paper } from "../models/papers.model.js";
import { Subscription } from "../models/subscription.model.js";
import { TestSeries } from "../models/testSeries.model.js";
import { Course } from "../models/courses.model.js";

/**
 * POST /api/v1/subscriptions
 * Create a subscription manually (admin or direct grant).
 * For payment-driven subscriptions, use verifyRazorpayPayment instead.
 *
 * Body: { type, itemId?, startDate, endDate }
 */
export const createSubscription = async (req, res) => {
  try {
    const { type, itemId, startDate, endDate } = req.body;
    const userId = req.user._id;

    // Types that do NOT require an itemId
    const broadTypes = ["all-access", "all-courses"];

    if (broadTypes.includes(type)) {
      if (itemId) {
        return res.status(400).json({
          message: `itemId should not be provided for "${type}" subscriptions`,
        });
      }
    } else {
      // Item-level types — require itemId + existence check
      if (!itemId) {
        return res.status(400).json({
          message: "itemId is required for this subscription type",
        });
      }

      if (type === "single-paper") {
        const exists = await Paper.exists({ _id: itemId });
        if (!exists) return res.status(404).json({ message: "Paper not found" });
      } else if (type === "test-series") {
        const exists = await TestSeries.exists({ _id: itemId });
        if (!exists)
          return res.status(404).json({ message: "Test series not found" });
      } else if (type === "single-course") {
        const exists = await Course.exists({ _id: itemId });
        if (!exists) return res.status(404).json({ message: "Course not found" });
      } else {
        return res.status(400).json({ message: "Invalid subscription type" });
      }
    }

    // Duplicate active subscription check
    const now = new Date();
    const dup = await Subscription.findOne({
      userId,
      type,
      ...(broadTypes.includes(type) ? {} : { itemId }),
      status: "active",
      endDate: { $gte: now },
    });

    if (dup) {
      return res
        .status(409)
        .json({ message: "Active subscription already exists" });
    }

    const subscription = await Subscription.create({
      userId,
      type,
      itemId: broadTypes.includes(type) ? null : itemId,
      startDate,
      endDate,
      status: "active",
    });

    return res.status(201).json({
      message: "Subscription created successfully",
      subscription,
    });
  } catch (err) {
    console.error("createSubscription error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/v1/subscriptions/me
 * Returns all subscriptions for the logged-in user.
 */
export const getMySubscription = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json(subscriptions);
  } catch (err) {
    console.error("getMySubscription error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/v1/subscriptions/:id
 * Owner or admin can delete a subscription.
 */
export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (
      subscription.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await subscription.deleteOne();
    return res
      .status(200)
      .json({ message: "Subscription deleted successfully" });
  } catch (err) {
    console.error("deleteSubscription error:", err);
    return res.status(500).json({ message: err.message });
  }
};