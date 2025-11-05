import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const createGroupRound = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    roundType: v.union(
      v.literal("CASUAL"),
      v.literal("PRACTICE"),
      v.literal("TOURNAMENT"),
      v.literal("COMPETITIVE")
    ),
    participants: v.array(v.object({
      userId: v.optional(v.id("users")),
      guestName: v.optional(v.string()),
      guestEmail: v.optional(v.string()),
      scores: v.array(v.object({
        hole: v.number(),
        strokes: v.number(),
      })),
    })),
    weather: v.optional(v.object({
      temperature: v.optional(v.number()),
      windSpeed: v.optional(v.number()),
      windDirection: v.optional(v.string()),
      conditions: v.optional(v.string()),
      humidity: v.optional(v.number()),
      pressure: v.optional(v.number()),
    })),
    notes: v.optional(v.string()),
    startedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.startedAt || Date.now();

    // Create group round
    const groupRoundId = await ctx.db.insert("groupRounds", {
      name: `Round at ${now}`,
      createdBy: args.userId,
      createdAt: now,
    });

    // Create rounds for each participant
    const roundIds = [];
    for (const participant of args.participants) {
      const totalStrokes = participant.scores.reduce((sum, score) => sum + score.strokes, 0);
      // Compute course par once
      const courseHoles = await ctx.db
        .query("courseHoles")
        .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
        .collect();
      const totalPar = courseHoles.reduce((sum, h) => sum + (h.par || 0), 0);
      
      // Calculate PDGA rating if applicable
      const { calculateRating } = await import("./pdgaRating");
      const rating = await calculateRating(ctx, args.courseId, totalStrokes);
      
      // Create the round
      const roundId = await ctx.db.insert("rounds", {
        userId: participant.userId || args.userId, // Use main user if guest
        courseId: args.courseId,
        startedAt: now,
        completed: true,
        totalStrokes,
        totalPar,
        relativeToPar: totalPar > 0 ? totalStrokes - totalPar : undefined,
        rating: rating || undefined,
        roundType: args.roundType,
        notes: args.notes,
        shared: false,
        groupRoundId,
      });

      // Create scores for this participant
      for (const score of participant.scores) {
        await ctx.db.insert("scores", {
          roundId,
          hole: score.hole,
          strokes: score.strokes,
        });
      }

      // Create round participant record
      await ctx.db.insert("roundParticipants", {
        roundId,
        userId: participant.userId,
        guestName: participant.guestName,
        guestEmail: participant.guestEmail,
        scores: participant.scores,
        totalStrokes,
        joinedAt: now,
      });

      roundIds.push(roundId);
    }

    // Create weather if provided (shared for all participants)
    if (args.weather) {
      for (const roundId of roundIds) {
        await ctx.db.insert("weather", {
          roundId,
          ...args.weather,
        });
      }
    }

    // Check for achievements for all participants after group round completion
    const uniqueUserIds = new Set(
      args.participants
        .map(p => p.userId)
        .filter(Boolean)
    );

    for (const userId of uniqueUserIds) {
      try {
        await ctx.runMutation(api.achievements.checkAchievements, {
          userId: userId as any,
        });
      } catch (error) {
        console.error(`Error checking achievements for user ${userId} after group round:`, error);
        // Don't fail the group round creation if achievement checking fails
      }

      try {
        await ctx.runMutation(api.goals.updateProgress, {
          userId: userId as any,
          goalType: "ROUNDS_PLAYED",
        });
      } catch (error) {
        console.error(`Error updating goal progress for user ${userId} after group round:`, error);
        // Don't fail the group round creation if goal updating fails
      }
    }

    return {
      groupRoundId,
      roundIds,
    };
  },
});

export const getGroupRound = query({
  args: { groupRoundId: v.id("groupRounds") },
  handler: async (ctx, args) => {
    const groupRound = await ctx.db.get(args.groupRoundId);
    if (!groupRound) return null;

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_group_round", (q) => q.eq("groupRoundId", args.groupRoundId))
      .collect();

    const participants = await Promise.all(
      rounds.map(async (round) => {
        const participant = await ctx.db
          .query("roundParticipants")
          .withIndex("by_round", (q) => q.eq("roundId", round._id))
          .first();
        
        const user = participant?.userId ? await ctx.db.get(participant.userId) : null;
        const course = await ctx.db.get(round.courseId);
        const scores = await ctx.db
          .query("scores")
          .withIndex("by_round", (q) => q.eq("roundId", round._id))
          .collect();

        return {
          round,
          participant,
          user,
          course,
          scores,
        };
      })
    );

    return {
      groupRound,
      participants,
    };
  },
});

export const getGroupRoundsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const groupRounds = await ctx.db
      .query("groupRounds")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
      .collect();

    const groupRoundsWithDetails = await Promise.all(
      groupRounds.map(async (groupRound) => {
        const rounds = await ctx.db
          .query("rounds")
          .withIndex("by_group_round", (q) => q.eq("groupRoundId", groupRound._id))
          .collect();

        const participants = await Promise.all(
          rounds.map(async (round) => {
            const participant = await ctx.db
              .query("roundParticipants")
              .withIndex("by_round", (q) => q.eq("roundId", round._id))
              .first();
            
            const user = participant?.userId ? await ctx.db.get(participant.userId) : null;
            return {
              round,
              participant,
              user,
            };
          })
        );

        return {
          ...groupRound,
          participants,
        };
      })
    );

    return groupRoundsWithDetails;
  },
});

