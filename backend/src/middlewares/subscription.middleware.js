// middlewares/subscription.middleware.js
import { Subscription } from "../models/subscription.model.js";
import { TestSeries } from "../models/testSeries.model.js";

/**
 * Require an active subscription that grants access to a specific PAPER.
 * Grants if:
 *  - user has active "all-access", OR
 *  - user has active "single-paper" for this paper, OR
 *  - user has active "test-series" for a series that CONTAINS this paper
 */
export const requireSubscriptionForPaper = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const paperId = req.params.id || req.params.paperId;
    const now = new Date();

    // Active all-access?
    const hasAllAccess = await Subscription.findOne({
      userId,
      type: "all-access",
      status: "active",
      endDate: { $gte: now }
    }).lean();
    if (hasAllAccess) return next();

    // Active single-paper for this paper?
    const hasSinglePaper = await Subscription.findOne({
      userId,
      type: "single-paper",
      itemId: paperId,
      status: "active",
      endDate: { $gte: now }
    }).lean();
    if (hasSinglePaper) return next();

    // Active test-series that contains this paper?
    const activeSeriesSubs = await Subscription.find({
      userId,
      type: "test-series",
      status: "active",
      endDate: { $gte: now }
    })
      .select("itemId")
      .lean();

    if (activeSeriesSubs.length) {
      const seriesIds = activeSeriesSubs.map(s => s.itemId);
      const count = await TestSeries.countDocuments({
        _id: { $in: seriesIds },
        papers: paperId
      });
      if (count > 0) return next();
    }

    return res
      .status(403)
      .json({ message: "No active subscription for this paper" });
  } catch (err) {
    console.error("requireSubscriptionForPaper error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Require an active subscription that grants access to a specific TEST SERIES.
 * Grants if:
 *  - user has active "all-access", OR
 *  - user has active "test-series" for this series
 */
export const requireSubscriptionForSeries = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const seriesId = req.params.id || req.params.seriesId;
    const now = new Date();

    // Active all-access?
    const hasAllAccess = await Subscription.findOne({
      userId,
      type: "all-access",
      status: "active",
      endDate: { $gte: now }
    }).lean();
    if (hasAllAccess) return next();

    // Active test-series for this series?
    const hasSeries = await Subscription.findOne({
      userId,
      type: "test-series",
      itemId: seriesId,
      status: "active",
      endDate: { $gte: now }
    }).lean();
    if (hasSeries) return next();

    return res
      .status(403)
      .json({ message: "No active subscription for this test series" });
  } catch (err) {
    console.error("requireSubscriptionForSeries error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
