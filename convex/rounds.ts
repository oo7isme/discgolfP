import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { calculateRating } from "./pdgaRating";

// Minimal rounds functions to allow deployment
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get course, scores, weather, and courseHoles for each round
    const roundsWithDetails = await Promise.all(
      rounds.map(async (round) => {
        const course = await ctx.db.get(round.courseId);
        const courseHoles = course ? await ctx.db
          .query("courseHoles")
          .withIndex("by_course", (q) => q.eq("courseId", round.courseId))
          .collect() : [];
        const scores = await ctx.db
          .query("scores")
          .withIndex("by_round", (q) => q.eq("roundId", round._id))
          .collect();
        const weather = await ctx.db
          .query("weather")
          .withIndex("by_round", (q) => q.eq("roundId", round._id))
          .first();
        
        return {
          ...round,
          course,
          courseHoles,
          scores,
          weather,
        };
      })
    );

    return roundsWithDetails;
  },
});

export const getById = query({
  args: { id: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.id);
    if (!round) return null;

    const course = await ctx.db.get(round.courseId);
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_round", (q) => q.eq("roundId", args.id))
      .collect();
    const weather = await ctx.db
      .query("weather")
      .withIndex("by_round", (q) => q.eq("roundId", args.id))
      .first();

    // Get participants if this is a group round
    const participants = await ctx.db
      .query("roundParticipants")
      .withIndex("by_round", (q) => q.eq("roundId", args.id))
      .collect();

    // Get participant details
    const participantsWithDetails = await Promise.all(
      participants.map(async (participant) => {
        let name = "Unknown Player";
        let totalStrokes = 0;

        if (participant.userId) {
          const user = await ctx.db.get(participant.userId);
          name = user?.name || user?.username || "Unknown User";
        } else if (participant.guestName) {
          name = participant.guestName;
        }

        // Calculate total strokes for this participant
        const participantScores = await ctx.db
          .query("scores")
          .withIndex("by_round", (q) => q.eq("roundId", args.id))
          .collect();
        
        totalStrokes = participantScores.reduce((sum, score) => sum + score.strokes, 0);

        return {
          name,
          totalStrokes,
        };
      })
    );

    return {
      ...round,
      course,
      scores,
      weather,
      participants: participantsWithDetails,
    };
  },
});

// Universal query that can handle both individual rounds and group rounds
export const getRoundOrGroupRoundById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Validate the ID format
    if (!args.id || typeof args.id !== 'string') {
      return null;
    }
    
    // First, try to get as individual round
    let round = null;
    try {
      round = await ctx.db.get(args.id as any);
    } catch (error) {
      // Not a valid rounds table ID, continue to group rounds
    }

    if (round && '_id' in round && 'courseId' in round) {
      // This is an individual round
      const course = await ctx.db.get(round.courseId);
      const courseHoles = course ? await ctx.db
        .query("courseHoles")
        .withIndex("by_course", (q) => q.eq("courseId", round.courseId))
        .collect() : [];
      const scores = await ctx.db
        .query("scores")
        .withIndex("by_round", (q) => q.eq("roundId", args.id as any))
        .collect();
      const weather = await ctx.db
        .query("weather")
        .withIndex("by_round", (q) => q.eq("roundId", args.id as any))
        .first();

      // Get participants if this is a group round
      const participants = await ctx.db
        .query("roundParticipants")
        .withIndex("by_round", (q) => q.eq("roundId", args.id as any))
        .collect();

      // Get participant details
      const participantsWithDetails = await Promise.all(
        participants.map(async (participant) => {
          let name = "Unknown Player";
          let totalStrokes = 0;

          try {
            if (participant.userId) {
              const user = await ctx.db.get(participant.userId);
              name = user?.name || user?.username || "Unknown User";
            } else if (participant.guestName) {
              name = participant.guestName;
            }

            // Calculate total strokes for this participant
            const participantScores = await ctx.db
              .query("scores")
              .withIndex("by_round", (q) => q.eq("roundId", args.id as any))
              .collect();
            
            totalStrokes = participantScores.reduce((sum, score) => sum + score.strokes, 0);
          } catch (error) {
            // If there's an error getting participant details, use defaults
            console.log('Error getting participant details:', error);
          }

          return {
            name,
            totalStrokes,
          };
        })
      );

      return {
        ...round,
        course,
        courseHoles,
        scores,
        weather,
        participants: participantsWithDetails,
      };
    }

    // If not found in rounds table, try groupRounds table
    let groupRound = null;
    try {
      groupRound = await ctx.db.get(args.id as any);
    } catch (error) {
      // Not a valid groupRounds table ID either
    }

    if (groupRound) {
      // This is a group round
      // Get the first individual round to get course info
      const individualRounds = await ctx.db
        .query("rounds")
        .filter((q) => q.eq(q.field("groupRoundId"), args.id as any))
        .collect();
      
      const firstRound = individualRounds[0];
      const course = firstRound?.courseId ? await ctx.db.get(firstRound.courseId) : null;
      const courseHoles = course ? await ctx.db
        .query("courseHoles")
        .withIndex("by_course", (q) => q.eq("courseId", firstRound.courseId))
        .collect() : [];
      
      // Get the first round's scores as representative (or combine all)
      const scores = individualRounds.length > 0 ? await ctx.db
        .query("scores")
        .withIndex("by_round", (q) => q.eq("roundId", individualRounds[0]._id))
        .collect() : [];

      const weather = individualRounds.length > 0 ? await ctx.db
        .query("weather")
        .withIndex("by_round", (q) => q.eq("roundId", individualRounds[0]._id))
        .first() : null;

      // Get participants from group round
      const participants = individualRounds.length > 0 ? await ctx.db
        .query("roundParticipants")
        .withIndex("by_round", (q) => q.eq("roundId", individualRounds[0]._id))
        .collect() : [];

      // Get participant details
      const participantsWithDetails = await Promise.all(
        participants.map(async (participant) => {
          let name = "Unknown Player";
          let totalStrokes = 0;

          try {
            if (participant.userId) {
              const user = await ctx.db.get(participant.userId);
              name = user?.name || user?.username || "Unknown User";
            } else if (participant.guestName) {
              name = participant.guestName;
            }

            // Calculate total strokes for this participant
            const participantScores = individualRounds.length > 0 ? await ctx.db
              .query("scores")
              .withIndex("by_round", (q) => q.eq("roundId", individualRounds[0]._id))
              .collect() : [];
            
            totalStrokes = participantScores.reduce((sum, score) => sum + score.strokes, 0);
          } catch (error) {
            // If there's an error getting participant details, use defaults
            console.log('Error getting participant details:', error);
          }

          return {
            name,
            totalStrokes,
          };
        })
      );

      return {
        ...groupRound,
        course,
        courseHoles,
        scores,
        weather,
        participants: participantsWithDetails,
        isGroupRound: true,
      };
    }

    // If not found in either table, return null
    return null;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    scores: v.array(v.object({
      hole: v.number(),
      strokes: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const roundId = await ctx.db.insert("rounds", {
      userId: args.userId,
      courseId: args.courseId,
      startedAt: Date.now(),
      completed: true,
      roundType: "CASUAL",
      shared: false,
    });

    for (const score of args.scores) {
      await ctx.db.insert("scores", {
        roundId,
        hole: score.hole,
        strokes: score.strokes,
      });
    }

    // Compute totals for this round and store on the round document for fast queries/achievements
    const totalStrokes = args.scores.reduce((sum, s) => sum + s.strokes, 0);
    const courseHoles = await ctx.db
      .query("courseHoles")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    const totalPar = courseHoles.reduce((sum, h) => sum + (h.par || 0), 0);
    
    // Calculate PDGA rating if applicable
    const rating = await calculateRating(ctx, args.courseId, totalStrokes);
    
    await ctx.db.patch(roundId, {
      totalStrokes,
      totalPar,
      relativeToPar: totalPar > 0 ? totalStrokes - totalPar : undefined,
      rating: rating || undefined,
    });


    // Check for achievements after round completion
    try {
      await ctx.runMutation(api.achievements.checkAchievements, {
        userId: args.userId,
      });
    } catch (error) {
      console.error("Error checking achievements after round creation:", error);
      // Don't fail the round creation if achievement checking fails
    }

    // Update goal progress
    try {
      await ctx.runMutation(api.goals.updateProgress, {
        userId: args.userId,
        goalType: "ROUNDS_PLAYED",
      });
    } catch (error) {
      console.error("Error updating goal progress after round creation:", error);
      // Don't fail the round creation if goal updating fails
    }

    return roundId;
  },
});

export const share = mutation({
  args: { id: v.id("rounds") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { shared: true });
    return { shareUrl: `/rounds/${args.id}` };
  },
});
