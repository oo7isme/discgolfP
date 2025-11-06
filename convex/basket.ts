import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get basket position for a specific course and hole
export const getBasket = query({
  args: {
    courseId: v.id("courses"),
    holeNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const basket = await ctx.db
      .query("baskets")
      .withIndex("by_course_hole", (q) => 
        q.eq("courseId", args.courseId).eq("holeNumber", args.holeNumber)
      )
      .first();

    return basket;
  },
});

// Set or update basket position
export const setBasket = mutation({
  args: {
    courseId: v.id("courses"),
    holeNumber: v.number(),
    lat: v.number(),
    lon: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if basket already exists for this course/hole
    const existing = await ctx.db
      .query("baskets")
      .withIndex("by_course_hole", (q) => 
        q.eq("courseId", args.courseId).eq("holeNumber", args.holeNumber)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing basket
      await ctx.db.patch(existing._id, {
        lat: args.lat,
        lon: args.lon,
        userId: args.userId,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new basket
      const basketId = await ctx.db.insert("baskets", {
        courseId: args.courseId,
        holeNumber: args.holeNumber,
        lat: args.lat,
        lon: args.lon,
        userId: args.userId,
        updatedAt: now,
      });
      return basketId;
    }
  },
});

