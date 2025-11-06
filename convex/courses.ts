import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const getById = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("courses").collect();
    const searchTerm = args.query.toLowerCase();
    
    return courses.filter(course => 
      course.name.toLowerCase().includes(searchTerm) ||
      course.location?.toLowerCase().includes(searchTerm) ||
      course.description?.toLowerCase().includes(searchTerm)
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    addressUrl: v.optional(v.string()),
    holes: v.number(),
    estimatedLengthMeters: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    difficulty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("courses", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getHoles = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseHoles")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const createHoles = mutation({
  args: {
    courseId: v.id("courses"),
    holes: v.array(v.object({
      hole: v.number(),
      par: v.number(),
      distanceMeters: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const holeIds = [];
    for (const hole of args.holes) {
      const holeId = await ctx.db.insert("courseHoles", {
        courseId: args.courseId,
        ...hole,
      });
      holeIds.push(holeId);
    }
    return holeIds;
  },
});

// Update Ekeberg course with correct data
export const updateEkebergCourse = mutation({
  handler: async (ctx) => {
    // First, find the Ekeberg course
    const courses = await ctx.db.query("courses").collect();
    const ekebergCourse = courses.find(course => 
      course.name.toLowerCase().includes('ekeberg')
    );
    
    if (!ekebergCourse) {
      throw new Error("Ekeberg course not found");
    }
    
    // Delete existing holes
    const existingHoles = await ctx.db
      .query("courseHoles")
      .withIndex("by_course", (q) => q.eq("courseId", ekebergCourse._id))
      .collect();
    
    for (const hole of existingHoles) {
      await ctx.db.delete(hole._id);
    }
    
    // Create new holes with correct Ekeberg data (from the image)
    const ekebergHoles = [
      { hole: 1, par: 3, distanceMeters: 59 }, // 195 ft
      { hole: 2, par: 3, distanceMeters: 66 }, // 215 ft
      { hole: 3, par: 4, distanceMeters: 111 }, // 364 ft
      { hole: 4, par: 3, distanceMeters: 80 }, // 264 ft
      { hole: 5, par: 3, distanceMeters: 74 }, // 244 ft
      { hole: 6, par: 3, distanceMeters: 70 }, // 230 ft
      { hole: 7, par: 3, distanceMeters: 44 }, // 144 ft
      { hole: 8, par: 3, distanceMeters: 67 }, // 219 ft
      { hole: 9, par: 3, distanceMeters: 53 }, // 173 ft
      { hole: 10, par: 3, distanceMeters: 40 }, // 132 ft
      { hole: 11, par: 3, distanceMeters: 68 }, // 224 ft
      { hole: 12, par: 3, distanceMeters: 57 }, // 186 ft
      { hole: 13, par: 3, distanceMeters: 62 }, // 205 ft
      { hole: 14, par: 3, distanceMeters: 62 }, // 205 ft
      { hole: 15, par: 3, distanceMeters: 113 }, // 370 ft
      { hole: 16, par: 3, distanceMeters: 54 }, // 178 ft
      { hole: 17, par: 3, distanceMeters: 45 }, // 148 ft
      { hole: 18, par: 3, distanceMeters: 90 }, // 294 ft
    ];
    
    const holeIds = [];
    for (const hole of ekebergHoles) {
      const holeId = await ctx.db.insert("courseHoles", {
        courseId: ekebergCourse._id,
        ...hole,
      });
      holeIds.push(holeId);
    }
    
    return { courseId: ekebergCourse._id, holeIds };
  },
});

// Update Krokhol Blue Layout course with correct data
export const updateKrokholCourse = mutation({
  handler: async (ctx) => {
    // First, find the Krokhol course
    const courses = await ctx.db.query("courses").collect();
    const krokholCourse = courses.find(course => 
      course.name.toLowerCase().includes('krokhol')
    );
    
    if (!krokholCourse) {
      throw new Error("Krokhol course not found");
    }
    
    // Delete existing holes
    const existingHoles = await ctx.db
      .query("courseHoles")
      .withIndex("by_course", (q) => q.eq("courseId", krokholCourse._id))
      .collect();
    
    for (const hole of existingHoles) {
      await ctx.db.delete(hole._id);
    }
    
    // Create new holes with correct Krokhol Blue Layout data (from the image)
    const krokholHoles = [
      { hole: 1, par: 3, distanceMeters: 111 }, // 364 ft
      { hole: 2, par: 4, distanceMeters: 144 }, // 472 ft
      { hole: 3, par: 3, distanceMeters: 69 }, // 226 ft
      { hole: 4, par: 3, distanceMeters: 117 }, // 384 ft
      { hole: 5, par: 3, distanceMeters: 112 }, // 367 ft
      { hole: 6, par: 3, distanceMeters: 77 }, // 253 ft
      { hole: 7, par: 4, distanceMeters: 142 }, // 466 ft
      { hole: 8, par: 5, distanceMeters: 219 }, // 719 ft
      { hole: 9, par: 3, distanceMeters: 75 }, // 246 ft
      { hole: 10, par: 3, distanceMeters: 105 }, // 344 ft
      { hole: 11, par: 3, distanceMeters: 87 }, // 285 ft
      { hole: 12, par: 4, distanceMeters: 189 }, // 620 ft
      { hole: 13, par: 3, distanceMeters: 86 }, // 282 ft
      { hole: 14, par: 3, distanceMeters: 70 }, // 230 ft
      { hole: 15, par: 3, distanceMeters: 66 }, // 217 ft
      { hole: 16, par: 5, distanceMeters: 231 }, // 758 ft
      { hole: 17, par: 3, distanceMeters: 76 }, // 249 ft
      { hole: 18, par: 4, distanceMeters: 150 }, // 492 ft
    ];
    
    const holeIds = [];
    for (const hole of krokholHoles) {
      const holeId = await ctx.db.insert("courseHoles", {
        courseId: krokholCourse._id,
        ...hole,
      });
      holeIds.push(holeId);
    }
    
    return { courseId: krokholCourse._id, holeIds };
  },
});

// Add Langhus Disc Golf Course
export const addLanghusCourse = mutation({
  handler: async (ctx) => {
    // Check if Langhus course already exists
    const existingCourses = await ctx.db.query("courses").collect();
    const langhusCourse = existingCourses.find(course => 
      course.name.toLowerCase().includes('langhus')
    );
    
    if (langhusCourse) {
      console.log("Langhus course already exists, skipping");
      return { courseId: langhusCourse._id, message: "Course already exists" };
    }
    
    // Create the Langhus course
    const courseId = await ctx.db.insert("courses", {
      name: "Langhus Disc Golf Course",
      location: "Langhus, Norway",
      description: "Short - highly technical 18-hole course",
      holes: 18,
      estimatedLengthMeters: 1291, // 4237 ft converted to meters
      difficulty: "Intermediate",
      createdAt: Date.now(),
    });

    // Create the holes with the exact data from the screenshot
    const langhusHoles = [
      { hole: 1, par: 3, distanceMeters: 57 }, // 188 ft
      { hole: 2, par: 3, distanceMeters: 51 }, // 168 ft
      { hole: 3, par: 4, distanceMeters: 117 }, // 383 ft
      { hole: 4, par: 4, distanceMeters: 91 }, // 298 ft
      { hole: 5, par: 3, distanceMeters: 46 }, // 150 ft
      { hole: 6, par: 4, distanceMeters: 110 }, // 361 ft
      { hole: 7, par: 3, distanceMeters: 66 }, // 215 ft
      { hole: 8, par: 3, distanceMeters: 59 }, // 194 ft
      { hole: 9, par: 3, distanceMeters: 55 }, // 179 ft
      { hole: 10, par: 3, distanceMeters: 86 }, // 281 ft
      { hole: 11, par: 3, distanceMeters: 75 }, // 246 ft
      { hole: 12, par: 3, distanceMeters: 60 }, // 198 ft
      { hole: 13, par: 3, distanceMeters: 71 }, // 234 ft
      { hole: 14, par: 3, distanceMeters: 55 }, // 179 ft
      { hole: 15, par: 3, distanceMeters: 48 }, // 158 ft
      { hole: 16, par: 3, distanceMeters: 73 }, // 239 ft
      { hole: 17, par: 3, distanceMeters: 106 }, // 349 ft
      { hole: 18, par: 3, distanceMeters: 66 }, // 217 ft
    ];
    
    const holeIds = [];
    for (const hole of langhusHoles) {
      const holeId = await ctx.db.insert("courseHoles", {
        courseId: courseId,
        ...hole,
      });
      holeIds.push(holeId);
    }
    
    return { 
      courseId: courseId, 
      holeIds,
      message: "Langhus Disc Golf Course added successfully",
      totalHoles: langhusHoles.length,
      totalPar: langhusHoles.reduce((sum, hole) => sum + hole.par, 0)
    };
  },
});

// Update Stovner Discgolfpark with Main 2025 layout
export const updateStovnerCourse2025 = mutation({
  handler: async (ctx) => {
    // Find the existing Stovner course
    const existingCourses = await ctx.db.query("courses").collect();
    const stovnerCourse = existingCourses.find(course => 
      course.name.toLowerCase().includes('stovner')
    );
    
    if (!stovnerCourse) {
      // Create new Stovner course if it doesn't exist
      const courseId = await ctx.db.insert("courses", {
        name: "Stovner Discgolfpark",
        location: "Oslo, Norway",
        description: "Long - technical 18-hole course",
        holes: 18,
        estimatedLengthMeters: 2031, // 6664 ft converted to meters
        difficulty: "Advanced",
        createdAt: Date.now(),
      });

      // Create the holes with the Main 2025 layout data
      const stovnerHoles = [
        { hole: 1, par: 3, distanceMeters: 88 }, // 290 ft
        { hole: 2, par: 3, distanceMeters: 78 }, // 256 ft
        { hole: 3, par: 3, distanceMeters: 114 }, // 374 ft
        { hole: 4, par: 3, distanceMeters: 119 }, // 389 ft
        { hole: 5, par: 3, distanceMeters: 130 }, // 425 ft
        { hole: 6, par: 3, distanceMeters: 124 }, // 407 ft
        { hole: 7, par: 4, distanceMeters: 205 }, // 673 ft
        { hole: 8, par: 3, distanceMeters: 75 }, // 247 ft
        { hole: 9, par: 3, distanceMeters: 92 }, // 303 ft
        { hole: 10, par: 4, distanceMeters: 165 }, // 541 ft
        { hole: 11, par: 4, distanceMeters: 195 }, // 639 ft
        { hole: 12, par: 3, distanceMeters: 87 }, // 286 ft
        { hole: 13, par: 3, distanceMeters: 131 }, // 429 ft
        { hole: 14, par: 3, distanceMeters: 91 }, // 298 ft
        { hole: 15, par: 3, distanceMeters: 98 }, // 320 ft
        { hole: 16, par: 3, distanceMeters: 66 }, // 217 ft
        { hole: 17, par: 3, distanceMeters: 71 }, // 232 ft
        { hole: 18, par: 3, distanceMeters: 103 }, // 337 ft
      ];
      
      const holeIds = [];
      for (const hole of stovnerHoles) {
        const holeId = await ctx.db.insert("courseHoles", {
          courseId: courseId,
          ...hole,
        });
        holeIds.push(holeId);
      }
      
      return { 
        courseId: courseId, 
        holeIds,
        message: "Stovner Discgolfpark created with Main 2025 layout",
        totalHoles: stovnerHoles.length,
        totalPar: stovnerHoles.reduce((sum, hole) => sum + hole.par, 0)
      };
    }
    
    // Update existing course with new layout data
    await ctx.db.patch(stovnerCourse._id, {
      description: "Long - technical 18-hole course (Main 2025 layout)",
      estimatedLengthMeters: 2031, // 6664 ft converted to meters
      difficulty: "Advanced",
    });

    // Delete existing holes
    const existingHoles = await ctx.db
      .query("courseHoles")
      .withIndex("by_course", (q) => q.eq("courseId", stovnerCourse._id))
      .collect();
    
    for (const hole of existingHoles) {
      await ctx.db.delete(hole._id);
    }
    
    // Create new holes with Main 2025 layout
    const stovnerHoles = [
      { hole: 1, par: 3, distanceMeters: 88 }, // 290 ft
      { hole: 2, par: 3, distanceMeters: 78 }, // 256 ft
      { hole: 3, par: 3, distanceMeters: 114 }, // 374 ft
      { hole: 4, par: 3, distanceMeters: 119 }, // 389 ft
      { hole: 5, par: 3, distanceMeters: 130 }, // 425 ft
      { hole: 6, par: 3, distanceMeters: 124 }, // 407 ft
      { hole: 7, par: 4, distanceMeters: 205 }, // 673 ft
      { hole: 8, par: 3, distanceMeters: 75 }, // 247 ft
      { hole: 9, par: 3, distanceMeters: 92 }, // 303 ft
      { hole: 10, par: 4, distanceMeters: 165 }, // 541 ft
      { hole: 11, par: 4, distanceMeters: 195 }, // 639 ft
      { hole: 12, par: 3, distanceMeters: 87 }, // 286 ft
      { hole: 13, par: 3, distanceMeters: 131 }, // 429 ft
      { hole: 14, par: 3, distanceMeters: 91 }, // 298 ft
      { hole: 15, par: 3, distanceMeters: 98 }, // 320 ft
      { hole: 16, par: 3, distanceMeters: 66 }, // 217 ft
      { hole: 17, par: 3, distanceMeters: 71 }, // 232 ft
      { hole: 18, par: 3, distanceMeters: 103 }, // 337 ft
    ];
    
    const holeIds = [];
    for (const hole of stovnerHoles) {
      const holeId = await ctx.db.insert("courseHoles", {
        courseId: stovnerCourse._id,
        ...hole,
      });
      holeIds.push(holeId);
    }
    
    return { 
      courseId: stovnerCourse._id, 
      holeIds,
      message: "Stovner Discgolfpark updated with Main 2025 layout",
      totalHoles: stovnerHoles.length,
      totalPar: stovnerHoles.reduce((sum, hole) => sum + hole.par, 0)
    };
  },
});

// Add Oppegård IL Diskgolfbane Main Course
export const addOppegardCourse = mutation({
  handler: async (ctx) => {
    // Check if Oppegård course already exists
    const existingCourses = await ctx.db.query("courses").collect();
    const oppegardCourse = existingCourses.find(course => 
      course.name.toLowerCase().includes('oppegård') || course.name.toLowerCase().includes('oppegard')
    );
    
    if (oppegardCourse) {
      console.log("Oppegård course already exists, skipping");
      return { courseId: oppegardCourse._id, message: "Course already exists" };
    }
    
    // Create the Oppegård course
    const courseId = await ctx.db.insert("courses", {
      name: "Oppegård IL Diskgolfbane",
      location: "Oppegård, Norway",
      description: "Short - technical 9-hole course",
      holes: 9,
      estimatedLengthMeters: 654, // 2146 ft converted to meters
      difficulty: "Intermediate",
      createdAt: Date.now(),
    });

    // Create the holes with the exact data from the screenshot
    const oppegardHoles = [
      { hole: 1, par: 3, distanceMeters: 62 }, // 204 ft
      { hole: 2, par: 3, distanceMeters: 65 }, // 214 ft
      { hole: 3, par: 3, distanceMeters: 85 }, // 280 ft
      { hole: 4, par: 3, distanceMeters: 77 }, // 251 ft
      { hole: 5, par: 3, distanceMeters: 64 }, // 211 ft
      { hole: 6, par: 3, distanceMeters: 66 }, // 217 ft
      { hole: 7, par: 3, distanceMeters: 73 }, // 239 ft
      { hole: 8, par: 3, distanceMeters: 57 }, // 187 ft
      { hole: 9, par: 3, distanceMeters: 105 }, // 343 ft
    ];
    
    const holeIds = [];
    for (const hole of oppegardHoles) {
      const holeId = await ctx.db.insert("courseHoles", {
        courseId: courseId,
        ...hole,
      });
      holeIds.push(holeId);
    }
    
    return { 
      courseId: courseId, 
      holeIds,
      message: "Oppegård IL Diskgolfbane added successfully",
      totalHoles: oppegardHoles.length,
      totalPar: oppegardHoles.reduce((sum, hole) => sum + hole.par, 0)
    };
  },
});

// Update hole positions (tee and basket)
export const updateHolePositions = mutation({
  args: {
    courseId: v.id("courses"),
    hole: v.number(),
    teeLat: v.optional(v.number()),
    teeLon: v.optional(v.number()),
    basketLat: v.optional(v.number()),
    basketLon: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { courseId, hole, teeLat, teeLon, basketLat, basketLon } = args;
    
    // Find the hole
    const existingHole = await ctx.db
      .query("courseHoles")
      .withIndex("by_course_hole", (q) => q.eq("courseId", courseId).eq("hole", hole))
      .first();

    if (!existingHole) {
      throw new Error(`Hole ${hole} not found for this course`);
    }

    // Update the hole with new positions
    await ctx.db.patch(existingHole._id, {
      teeLat: teeLat ?? existingHole.teeLat,
      teeLon: teeLon ?? existingHole.teeLon,
      basketLat: basketLat ?? existingHole.basketLat,
      basketLon: basketLon ?? existingHole.basketLon,
    });

    return { success: true, holeId: existingHole._id };
  },
});

// Set Ekeberg hole positions (approximate coordinates for Ekeberg Disc Golf Course in Oslo)
export const setEkebergHolePositions = mutation({
  handler: async (ctx) => {
    // Find Ekeberg course
    const courses = await ctx.db.query("courses").collect();
    const ekebergCourse = courses.find(course => 
      course.name.toLowerCase().includes('ekeberg')
    );

    if (!ekebergCourse) {
      throw new Error("Ekeberg course not found");
    }

    // Ekeberg Disc Golf Course coordinates from OpenStreetMap GeoJSON
    // Coordinates extracted from map/lines.geojson - converted from [lon, lat] to [lat, lon]
    const ekebergHolePositions = [
      // Hole 1: tee at [10.7871644, 59.8949319], basket at [10.7877485, 59.8942663]
      { hole: 1, teeLat: 59.8949319, teeLon: 10.7871644, basketLat: 59.8942663, basketLon: 10.7877485 },
      // Hole 2: tee at [10.7879838, 59.8940167], basket at [10.7882011, 59.8945078]
      { hole: 2, teeLat: 59.8940167, teeLon: 10.7879838, basketLat: 59.8945078, basketLon: 10.7882011 },
      // Hole 3: tee at [10.7888656, 59.8935519], basket at [10.788934, 59.8926336] (last point in LineString)
      { hole: 3, teeLat: 59.8935519, teeLon: 10.7888656, basketLat: 59.8926336, basketLon: 10.788934 },
      // Hole 4: tee at [10.789687, 59.8918455], basket at [10.79032, 59.8915186]
      { hole: 4, teeLat: 59.8918455, teeLon: 10.789687, basketLat: 59.8915186, basketLon: 10.79032 },
      // Hole 5: tee at [10.7906104, 59.8913356], basket at [10.7910073, 59.8908404]
      { hole: 5, teeLat: 59.8913356, teeLon: 10.7906104, basketLat: 59.8908404, basketLon: 10.7910073 },
      // Hole 6: tee at [10.7919406, 59.8907458], basket at [10.792633, 59.890146]
      { hole: 6, teeLat: 59.8907458, teeLon: 10.7919406, basketLat: 59.890146, basketLon: 10.792633 },
      // Hole 7: tee at [10.792783, 59.8898562], basket at [10.7930418, 59.8896019]
      { hole: 7, teeLat: 59.8898562, teeLon: 10.792783, basketLat: 59.8896019, basketLon: 10.7930418 },
      // Hole 8: tee at [10.7931498, 59.8894145], basket at [10.7920554, 59.8891965]
      { hole: 8, teeLat: 59.8894145, teeLon: 10.7931498, basketLat: 59.8891965, basketLon: 10.7920554 },
      // Hole 9: tee at [10.7917175, 59.8894966], basket at [10.7909852, 59.8891992]
      { hole: 9, teeLat: 59.8894966, teeLon: 10.7917175, basketLat: 59.8891992, basketLon: 10.7909852 },
      // Hole 10: tee at [10.7909074, 59.8895376], basket at [10.7915083, 59.8897744]
      { hole: 10, teeLat: 59.8895376, teeLon: 10.7909074, basketLat: 59.8897744, basketLon: 10.7915083 },
      // Hole 11: tee at [10.7917658, 59.8902588], basket at [10.7905051, 59.8900705]
      { hole: 11, teeLat: 59.8902588, teeLon: 10.7917658, basketLat: 59.8900705, basketLon: 10.7905051 },
      // Hole 12: tee at [10.790766, 59.8906931], basket at [10.7893793, 59.890902]
      { hole: 12, teeLat: 59.8906931, teeLon: 10.790766, basketLat: 59.890902, basketLon: 10.7893793 },
      // Hole 13: tee at [10.7887127, 59.8915838], basket at [10.7896247, 59.8915193]
      { hole: 13, teeLat: 59.8915838, teeLon: 10.7887127, basketLat: 59.8915193, basketLon: 10.7896247 },
      // Hole 14: tee at [10.7886879, 59.8922347], basket at [10.7896059, 59.892745] (last point)
      { hole: 14, teeLat: 59.8922347, teeLon: 10.7886879, basketLat: 59.892745, basketLon: 10.7896059 },
      // Hole 15: tee at [10.788598, 59.8936713], basket at [10.7867259, 59.8934883]
      { hole: 15, teeLat: 59.8936713, teeLon: 10.788598, basketLat: 59.8934883, basketLon: 10.7867259 },
      // Hole 16: tee at [10.7871255, 59.8927554], basket at [10.7878625, 59.8931052] (last point)
      { hole: 16, teeLat: 59.8927554, teeLon: 10.7871255, basketLat: 59.8931052, basketLon: 10.7878625 },
      // Hole 17: tee at [10.7863913, 59.8935913], basket at [10.7869177, 59.8927241]
      { hole: 17, teeLat: 59.8935913, teeLon: 10.7863913, basketLat: 59.8927241, basketLon: 10.7869177 },
      // Hole 18: tee at [10.7866836, 59.8937958], basket at [10.7876385, 59.8941059]
      { hole: 18, teeLat: 59.8937958, teeLon: 10.7866836, basketLat: 59.8941059, basketLon: 10.7876385 },
    ];

    const updatedHoles = [];
    for (const pos of ekebergHolePositions) {
      const existingHole = await ctx.db
        .query("courseHoles")
        .withIndex("by_course_hole", (q) => 
          q.eq("courseId", ekebergCourse._id).eq("hole", pos.hole)
        )
        .first();

      if (existingHole) {
        await ctx.db.patch(existingHole._id, {
          teeLat: pos.teeLat,
          teeLon: pos.teeLon,
          basketLat: pos.basketLat,
          basketLon: pos.basketLon,
        });
        updatedHoles.push(pos.hole);
      }
    }

    return {
      success: true,
      courseId: ekebergCourse._id,
      updatedHoles: updatedHoles.length,
      message: `Updated positions for ${updatedHoles.length} holes`,
    };
  },
});


