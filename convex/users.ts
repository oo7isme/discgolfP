import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    username: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      email: args.email,
      username: args.username,
      name: args.name,
      image: args.image,
      clerkId: args.clerkId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      username: args.username,
      name: args.name,
      image: args.image,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    return {
      exists: !!user,
      user,
    };
  },
});

export const updateUserWithUsername = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if username is already taken
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUser && existingUser._id !== user._id) {
      throw new Error("Username already taken");
    }

    await ctx.db.patch(user._id, {
      username: args.username,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const generateUsernameForUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.username) {
      return user; // User already has a username
    }

    // Generate username from email or name
    let username = '';
    if (user.name) {
      // Use name: "John Doe" -> "john_doe"
      username = user.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    } else if (user.email) {
      // Use email: "john@example.com" -> "john"
      username = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    
    // Add random number if username is too short or empty
    if (username.length < 3) {
      username = `user_${Math.random().toString(36).substr(2, 6)}`;
    }

    // Check if username is already taken and add number if needed
    let finalUsername = username;
    let counter = 1;
    while (true) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", finalUsername))
        .first();
      
      if (!existingUser) {
        break; // Username is available
      }
      
      finalUsername = `${username}_${counter}`;
      counter++;
    }

    await ctx.db.patch(user._id, {
      username: finalUsername,
      updatedAt: Date.now(),
    });

    return { ...user, username: finalUsername };
  },
});

export const deleteUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null; // User not found, nothing to delete
    }

    // Delete all related data
    // 1. Delete user's rounds
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const round of rounds) {
      // Delete scores for this round
      const scores = await ctx.db
        .query("scores")
        .withIndex("by_round", (q) => q.eq("roundId", round._id))
        .collect();
      
      for (const score of scores) {
        await ctx.db.delete(score._id);
      }

      // Delete weather for this round
      const weather = await ctx.db
        .query("weather")
        .withIndex("by_round", (q) => q.eq("roundId", round._id))
        .first();
      
      if (weather) {
        await ctx.db.delete(weather._id);
      }

      // Delete round participants for this round
      const participants = await ctx.db
        .query("roundParticipants")
        .withIndex("by_round", (q) => q.eq("roundId", round._id))
        .collect();
      
      for (const participant of participants) {
        await ctx.db.delete(participant._id);
      }

      // Delete the round itself
      await ctx.db.delete(round._id);
    }

    // 2. Delete user's friendships (both as requester and addressee)
    const friendshipsAsRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .collect();

    const friendshipsAsAddressee = await ctx.db
      .query("friendships")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", user._id))
      .collect();

    for (const friendship of [...friendshipsAsRequester, ...friendshipsAsAddressee]) {
      await ctx.db.delete(friendship._id);
    }

    // 3. Delete user's group rounds
    const groupRounds = await ctx.db
      .query("groupRounds")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    for (const groupRound of groupRounds) {
      await ctx.db.delete(groupRound._id);
    }

    // 4. Delete user's achievements
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const achievement of userAchievements) {
      await ctx.db.delete(achievement._id);
    }

    // 5. Delete user's goals
    const userGoals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const goal of userGoals) {
      await ctx.db.delete(goal._id);
    }

    // 6. Delete user's favorite courses
    const favoriteCourses = await ctx.db
      .query("favoriteCourses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const favorite of favoriteCourses) {
      await ctx.db.delete(favorite._id);
    }

    // 7. Delete user's activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // 8. Delete user's round notes
    const roundNotes = await ctx.db
      .query("roundNotes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const note of roundNotes) {
      await ctx.db.delete(note._id);
    }

    // 9. Delete user's course leaderboard entries
    const courseLeaderboards = await ctx.db
      .query("courseLeaderboards")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const leaderboard of courseLeaderboards) {
      await ctx.db.delete(leaderboard._id);
    }

    // 10. Finally, delete the user
    await ctx.db.delete(user._id);

    return { deleted: true, userId: user._id };
  },
});

export const cleanupOrphanedUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // This function can be called periodically to clean up users
    // who might have been deleted in Clerk but not in Convex
    const allUsers = await ctx.db.query("users").collect();
    
    const orphanedUsers = [];
    
    for (const user of allUsers) {
      // Check if user still exists in Clerk by trying to get their data
      // Since we can't directly check Clerk from Convex, we'll mark users
      // as potentially orphaned if they haven't been updated recently
      const daysSinceUpdate = (Date.now() - user.updatedAt) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 30) { // 30 days of inactivity
        orphanedUsers.push(user);
      }
    }

    return {
      totalUsers: allUsers.length,
      potentiallyOrphaned: orphanedUsers.length,
      orphanedUsers: orphanedUsers.map(u => ({ id: u._id, email: u.email, lastUpdate: u.updatedAt }))
    };
  },
});

export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm || args.searchTerm.trim().length < 2) {
      return [];
    }

    const searchTerm = args.searchTerm.toLowerCase().trim();
    const allUsers = await ctx.db.query("users").collect();
    
    // Filter users by username, name, or email
    const matchingUsers = allUsers.filter(user => {
      const username = (user.username || '').toLowerCase();
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      
      return username.includes(searchTerm) || 
             name.includes(searchTerm) || 
             email.includes(searchTerm);
    });

    // Return up to 10 results
    return matchingUsers.slice(0, 10);
  },
});


