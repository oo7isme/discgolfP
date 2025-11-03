import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Get all achievements
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("achievements").collect();
  },
});

// Get user's earned achievements
export const getUserAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const achievements = await Promise.all(
      userAchievements.map(async (ua) => {
        const achievement = await ctx.db.get(ua.achievementId);
        return {
          ...achievement,
          earnedAt: ua.earnedAt,
        };
      })
    );

    return achievements.filter(Boolean);
  },
});

// Get user's achievement progress (earned vs total)
export const getUserAchievementProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allAchievements = await ctx.db.query("achievements").collect();
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
    
    const earned = allAchievements.filter(a => earnedAchievementIds.has(a._id));
    const unearned = allAchievements.filter(a => !earnedAchievementIds.has(a._id));

    const totalPoints = allAchievements.reduce((sum, a) => sum + a.points, 0);
    const earnedPoints = earned.reduce((sum, a) => sum + a.points, 0);

    return {
      earned,
      unearned,
      total: allAchievements.length,
      earnedCount: earned.length,
      totalPoints,
      earnedPoints,
      progress: allAchievements.length > 0 ? (earned.length / allAchievements.length) * 100 : 0,
    };
  },
});

// Award an achievement to a user
export const awardAchievement = mutation({
  args: {
    userId: v.id("users"),
    achievementId: v.id("achievements"),
  },
  handler: async (ctx, args) => {
    // Check if user already has this achievement
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_user_achievement", (q) => 
        q.eq("userId", args.userId).eq("achievementId", args.achievementId)
      )
      .first();

    if (existing) {
      return existing; // Already earned
    }

    // Award the achievement
    const userAchievement = await ctx.db.insert("userAchievements", {
      userId: args.userId,
      achievementId: args.achievementId,
      earnedAt: Date.now(),
    });

    // Create activity log
    const achievement = await ctx.db.get(args.achievementId);
    if (achievement) {
      await ctx.db.insert("activities", {
        userId: args.userId,
        type: "ACHIEVEMENT_EARNED",
        title: `Achievement Unlocked: ${achievement.name}`,
        description: achievement.description,
        data: JSON.stringify({
          achievementId: args.achievementId,
          points: achievement.points,
          category: achievement.category,
        }),
        createdAt: Date.now(),
      });
    }

    return userAchievement;
  },
});

// Seed achievements from JSON data
export const seedAchievements = mutation({
  handler: async (ctx) => {
    const achievementsData = [
      {
        name: "First Round",
        description: "Complete your first round",
        icon: "🎯",
        category: "Milestone",
        criteria: "Complete 1 round",
        points: 10
      },
      {
        name: "Century Club",
        description: "Play 100 rounds",
        icon: "💯",
        category: "Milestone",
        criteria: "Complete 100 rounds",
        points: 100
      },
      {
        name: "Course Master",
        description: "Play 10 different courses",
        icon: "🗺️",
        category: "Exploration",
        criteria: "Play 10 different courses",
        points: 50
      },
      {
        name: "Under Par",
        description: "Shoot under par on any course",
        icon: "🏆",
        category: "Performance",
        criteria: "Shoot under par",
        points: 75
      },
      {
        name: "Eagle Eye",
        description: "Score an eagle (2 under par)",
        icon: "🦅",
        category: "Performance",
        criteria: "Score an eagle",
        points: 100
      },
      {
        name: "Ace",
        description: "Score a hole-in-one",
        icon: "🎯",
        category: "Performance",
        criteria: "Score a hole-in-one",
        points: 200
      },
      {
        name: "Weather Warrior",
        description: "Play in 5 different weather conditions",
        icon: "🌦️",
        category: "Adventure",
        criteria: "Play in 5 different weather conditions",
        points: 30
      },
      {
        name: "Consistent",
        description: "Play 5 rounds in a week",
        icon: "📅",
        category: "Dedication",
        criteria: "Play 5 rounds in a week",
        points: 40
      },
      {
        name: "Social Player",
        description: "Add 5 friends",
        icon: "👥",
        category: "Social",
        criteria: "Add 5 friends",
        points: 25
      },
      {
        name: "Goal Setter",
        description: "Complete your first goal",
        icon: "🎯",
        category: "Progress",
        criteria: "Complete a goal",
        points: 20
      }
    ];

    // Clear existing achievements
    const existingAchievements = await ctx.db.query("achievements").collect();
    for (const achievement of existingAchievements) {
      await ctx.db.delete(achievement._id);
    }

    // Insert new achievements
    const achievementIds = [];
    for (const achievement of achievementsData) {
      const id = await ctx.db.insert("achievements", achievement);
      achievementIds.push(id);
    }

    return { inserted: achievementIds.length, achievementIds };
  },
});

// Check and award achievements based on user stats
export const checkAchievements = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.userId))
      .filter((q) => q.eq(q.field("status"), "ACCEPTED"))
      .collect();

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    // Get unique courses played
    const courseIds = new Set(rounds.map(r => r.courseId));
    const uniqueCourses = courseIds.size;

    const awardedAchievements = [];

    // Check First Round achievement
    if (rounds.length >= 1) {
      const achievement = await ctx.db
        .query("achievements")
        .filter((q) => q.eq(q.field("name"), "First Round"))
        .first();
      
      if (achievement) {
        const result = await ctx.runMutation(api.achievements.awardAchievement, {
          userId: args.userId,
          achievementId: achievement._id,
        });
        if (result) awardedAchievements.push(achievement);
      }
    }

    // Check Century Club achievement
    if (rounds.length >= 100) {
      const achievement = await ctx.db
        .query("achievements")
        .filter((q) => q.eq(q.field("name"), "Century Club"))
        .first();
      
      if (achievement) {
        const result = await ctx.runMutation(api.achievements.awardAchievement, {
          userId: args.userId,
          achievementId: achievement._id,
        });
        if (result) awardedAchievements.push(achievement);
      }
    }

    // Check Course Master achievement
    if (uniqueCourses >= 10) {
      const achievement = await ctx.db
        .query("achievements")
        .filter((q) => q.eq(q.field("name"), "Course Master"))
        .first();
      
      if (achievement) {
        const result = await ctx.runMutation(api.achievements.awardAchievement, {
          userId: args.userId,
          achievementId: achievement._id,
        });
        if (result) awardedAchievements.push(achievement);
      }
    }

    // Check Under Par achievement (prefer stored round totals; fallback to compute)
    {
      let hasUnderParRound = rounds.some(r =>
        typeof (r as any).totalStrokes === 'number' && typeof (r as any).totalPar === 'number' &&
        (r as any).totalPar > 0 && (r as any).totalStrokes < (r as any).totalPar
      );

      if (!hasUnderParRound) {
        // Fallback compute if totals are missing on old rounds
        const courseParCache = new Map<string, number>();
        for (const round of rounds) {
          const scores = await ctx.db
            .query("scores")
            .withIndex("by_round", (q) => q.eq("roundId", round._id))
            .collect();
          if (scores.length === 0) continue;
          const totalStrokes = scores.reduce((sum, s) => sum + s.strokes, 0);

          let coursePar = courseParCache.get(round.courseId as unknown as string);
          if (coursePar === undefined) {
            const courseHoles = await ctx.db
              .query("courseHoles")
              .withIndex("by_course", (q) => q.eq("courseId", round.courseId))
              .collect();
            coursePar = courseHoles.reduce((sum, h) => sum + (h.par || 0), 0);
            courseParCache.set(round.courseId as unknown as string, coursePar);
          }
          if (coursePar > 0 && totalStrokes < coursePar) { hasUnderParRound = true; break; }
        }
      }

      if (hasUnderParRound) {
        const achievement = await ctx.db
          .query("achievements")
          .filter((q) => q.eq(q.field("name"), "Under Par"))
          .first();

        if (achievement) {
          const result = await ctx.runMutation(api.achievements.awardAchievement, {
            userId: args.userId,
            achievementId: achievement._id,
          });
          if (result) awardedAchievements.push(achievement);
        }
      }
    }

    // Check Social Player achievement
    if (friendships.length >= 5) {
      const achievement = await ctx.db
        .query("achievements")
        .filter((q) => q.eq(q.field("name"), "Social Player"))
        .first();
      
      if (achievement) {
        const result = await ctx.runMutation(api.achievements.awardAchievement, {
          userId: args.userId,
          achievementId: achievement._id,
        });
        if (result) awardedAchievements.push(achievement);
      }
    }

    // Check Goal Setter achievement
    if (goals.length >= 1) {
      const achievement = await ctx.db
        .query("achievements")
        .filter((q) => q.eq(q.field("name"), "Goal Setter"))
        .first();
      
      if (achievement) {
        const result = await ctx.runMutation(api.achievements.awardAchievement, {
          userId: args.userId,
          achievementId: achievement._id,
        });
        if (result) awardedAchievements.push(achievement);
      }
    }

    return awardedAchievements;
  },
});

// Check and award achievements for all existing users
export const checkAllUsersAchievements = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const results = [];

    for (const user of users) {
      try {
        // Get user's data to check achievements
        const rounds = await ctx.db
          .query("rounds")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const friendships = await ctx.db
          .query("friendships")
          .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
          .filter((q) => q.eq(q.field("status"), "ACCEPTED"))
          .collect();

        const goals = await ctx.db
          .query("goals")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("completed"), true))
          .collect();

        // Get unique courses played
        const courseIds = new Set(rounds.map(r => r.courseId));
        const uniqueCourses = courseIds.size;

        const awardedAchievements = [];

        // Check First Round achievement
        if (rounds.length >= 1) {
          const achievement = await ctx.db
            .query("achievements")
            .filter((q) => q.eq(q.field("name"), "First Round"))
            .first();
          
          if (achievement) {
            // Check if already earned
            const existing = await ctx.db
              .query("userAchievements")
              .withIndex("by_user_achievement", (q) => 
                q.eq("userId", user._id).eq("achievementId", achievement._id)
              )
              .first();

            if (!existing) {
              await ctx.db.insert("userAchievements", {
                userId: user._id,
                achievementId: achievement._id,
                earnedAt: Date.now(),
              });
              awardedAchievements.push(achievement);
            }
          }
        }

        // Check Century Club achievement
        if (rounds.length >= 100) {
          const achievement = await ctx.db
            .query("achievements")
            .filter((q) => q.eq(q.field("name"), "Century Club"))
            .first();
          
          if (achievement) {
            const existing = await ctx.db
              .query("userAchievements")
              .withIndex("by_user_achievement", (q) => 
                q.eq("userId", user._id).eq("achievementId", achievement._id)
              )
              .first();

            if (!existing) {
              await ctx.db.insert("userAchievements", {
                userId: user._id,
                achievementId: achievement._id,
                earnedAt: Date.now(),
              });
              awardedAchievements.push(achievement);
            }
          }
        }

        // Check Course Master achievement
        if (uniqueCourses >= 10) {
          const achievement = await ctx.db
            .query("achievements")
            .filter((q) => q.eq(q.field("name"), "Course Master"))
            .first();
          
          if (achievement) {
            const existing = await ctx.db
              .query("userAchievements")
              .withIndex("by_user_achievement", (q) => 
                q.eq("userId", user._id).eq("achievementId", achievement._id)
              )
              .first();

            if (!existing) {
              await ctx.db.insert("userAchievements", {
                userId: user._id,
                achievementId: achievement._id,
                earnedAt: Date.now(),
              });
              awardedAchievements.push(achievement);
            }
          }
        }

        // Check Social Player achievement
        if (friendships.length >= 5) {
          const achievement = await ctx.db
            .query("achievements")
            .filter((q) => q.eq(q.field("name"), "Social Player"))
            .first();
          
          if (achievement) {
            const existing = await ctx.db
              .query("userAchievements")
              .withIndex("by_user_achievement", (q) => 
                q.eq("userId", user._id).eq("achievementId", achievement._id)
              )
              .first();

            if (!existing) {
              await ctx.db.insert("userAchievements", {
                userId: user._id,
                achievementId: achievement._id,
                earnedAt: Date.now(),
              });
              awardedAchievements.push(achievement);
            }
          }
        }

        // Check Goal Setter achievement
        if (goals.length >= 1) {
          const achievement = await ctx.db
            .query("achievements")
            .filter((q) => q.eq(q.field("name"), "Goal Setter"))
            .first();
          
          if (achievement) {
            const existing = await ctx.db
              .query("userAchievements")
              .withIndex("by_user_achievement", (q) => 
                q.eq("userId", user._id).eq("achievementId", achievement._id)
              )
              .first();

            if (!existing) {
              await ctx.db.insert("userAchievements", {
                userId: user._id,
                achievementId: achievement._id,
                earnedAt: Date.now(),
              });
              awardedAchievements.push(achievement);
            }
          }
        }
        
        results.push({
          userId: user._id,
          username: user.username || user.email,
          awardedCount: awardedAchievements.length,
          achievements: awardedAchievements.map(a => a.name),
        });
      } catch (error) {
        console.error(`Error checking achievements for user ${user._id}:`, error);
        results.push({
          userId: user._id,
          username: user.username || user.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      totalUsers: users.length,
      results,
    };
  },
});
