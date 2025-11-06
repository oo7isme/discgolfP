import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    username: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    clerkId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_clerk_id", ["clerkId"]),

  courses: defineTable({
    name: v.string(),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    addressUrl: v.optional(v.string()),
    holes: v.number(),
    estimatedLengthMeters: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    difficulty: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_name", ["name"]),

  courseHoles: defineTable({
    courseId: v.id("courses"),
    hole: v.number(),
    par: v.number(),
    distanceMeters: v.optional(v.number()),
    teeLat: v.optional(v.number()),
    teeLon: v.optional(v.number()),
    basketLat: v.optional(v.number()),
    basketLon: v.optional(v.number()),
  })
    .index("by_course", ["courseId"])
    .index("by_course_hole", ["courseId", "hole"]),

  rounds: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    startedAt: v.number(),
    completed: v.boolean(),
    totalStrokes: v.optional(v.number()),
    totalPar: v.optional(v.number()),
    relativeToPar: v.optional(v.number()),
    rating: v.optional(v.number()),
    roundType: v.union(
      v.literal("CASUAL"),
      v.literal("PRACTICE"),
      v.literal("TOURNAMENT"),
      v.literal("COMPETITIVE")
    ),
    notes: v.optional(v.string()),
    shared: v.boolean(),
    groupRoundId: v.optional(v.id("groupRounds")),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_group_round", ["groupRoundId"]),

  scores: defineTable({
    roundId: v.id("rounds"),
    hole: v.number(),
    strokes: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_hole", ["roundId", "hole"]),

  friendships: defineTable({
    requesterId: v.id("users"),
    addresseeId: v.id("users"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACCEPTED"),
      v.literal("BLOCKED")
    ),
    createdAt: v.number(),
  })
    .index("by_requester", ["requesterId"])
    .index("by_addressee", ["addresseeId"])
    .index("by_requester_addressee", ["requesterId", "addresseeId"]),

  weather: defineTable({
    roundId: v.id("rounds"),
    temperature: v.optional(v.number()),
    windSpeed: v.optional(v.number()),
    windDirection: v.optional(v.string()),
    conditions: v.optional(v.string()),
    humidity: v.optional(v.number()),
    pressure: v.optional(v.number()),
  })
    .index("by_round", ["roundId"]),

  groupRounds: defineTable({
    name: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_creator", ["createdBy"]),

  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_creator", ["createdBy"]),

  userGroups: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    role: v.union(v.literal("ADMIN"), v.literal("MEMBER")),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"])
    .index("by_user_group", ["userId", "groupId"]),

  challenges: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("WEEKLY"),
      v.literal("MONTHLY"),
      v.literal("CUSTOM")
    ),
    startDate: v.number(),
    endDate: v.number(),
    target: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"]),

  challengeParticipants: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    score: v.optional(v.number()),
    completed: v.boolean(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_user", ["challengeId", "userId"]),

  achievements: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    category: v.string(),
    criteria: v.string(),
    points: v.number(),
  }),

  userAchievements: defineTable({
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    earnedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_achievement", ["achievementId"])
    .index("by_user_achievement", ["userId", "achievementId"]),

  goals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("SCORE_IMPROVEMENT"),
      v.literal("ROUNDS_PLAYED"),
      v.literal("COURSES_PLAYED"),
      v.literal("DISTANCE_THROWN"),
      v.literal("PUTTING_ACCURACY"),
      v.literal("CUSTOM")
    ),
    target: v.number(),
    current: v.number(),
    deadline: v.optional(v.number()),
    completed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  courseLeaderboards: defineTable({
    courseId: v.id("courses"),
    userId: v.id("users"),
    bestScore: v.number(),
    roundCount: v.number(),
    averageScore: v.number(),
    lastPlayed: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_user", ["userId"])
    .index("by_course_user", ["courseId", "userId"]),

  roundNotes: defineTable({
    roundId: v.id("rounds"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_user", ["userId"]),

  activities: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("ROUND_COMPLETED"),
      v.literal("ACHIEVEMENT_EARNED"),
      v.literal("GOAL_COMPLETED"),
      v.literal("FRIEND_ADDED"),
      v.literal("CHALLENGE_COMPLETED"),
      v.literal("PERSONAL_BEST")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    data: v.optional(v.string()), // JSON data
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  roundParticipants: defineTable({
    roundId: v.id("rounds"),
    userId: v.optional(v.id("users")), // null for guests
    guestName: v.optional(v.string()), // for guests
    guestEmail: v.optional(v.string()), // for guests
    scores: v.array(v.object({
      hole: v.number(),
      strokes: v.number(),
    })),
    totalStrokes: v.number(),
    joinedAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_user", ["userId"])
    .index("by_round_user", ["roundId", "userId"]),

  favoriteCourses: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    dashboardLayout: v.union(
      v.literal("COMPACT"),
      v.literal("DEFAULT"),
      v.literal("DETAILED")
    ),
    enabledStats: v.array(v.string()), // Array of stat keys like ["totalRounds", "bestScore", "aces", "birdies", "averageScore", "consistency", "improvement"]
    enabledShortcuts: v.array(v.string()), // Array of shortcut keys like ["newRound", "previousRounds", "stats", "friends", "courses", "leaderboard"]
    statsOrder: v.array(v.string()), // Order of stats display
    shortcutsOrder: v.array(v.string()), // Order of shortcuts display
    showWelcomeMessage: v.boolean(),
    showQuickActions: v.boolean(),
    showRecentActivity: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  baskets: defineTable({
    courseId: v.id("courses"),
    holeNumber: v.number(),
    lat: v.number(),
    lon: v.number(),
    userId: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_course_hole", ["courseId", "holeNumber"])
    .index("by_user", ["userId"]),
});

