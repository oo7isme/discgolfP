/**
 * PDGA Rating calculation for Ekeberg course
 * Based on the provided score-to-rating lookup table
 */

// Score to rating lookup table for Ekeberg
// Based on PDGA rating table provided:
// Better scores (lower) = higher ratings
// Each stroke worse = 12 rating points lower
const EKEBERG_RATING_TABLE = [
  { min: 36, max: 45, base: 1110, increment: 12 }, // 36=1110, 45=1002
  { min: 46, max: 55, base: 990, increment: 12 },  // 46=990, 55=882
  { min: 56, max: 65, base: 870, increment: 12 },  // 56=870, 65=762
  { min: 66, max: 75, base: 750, increment: 12 },  // 66=750, 75=642
  { min: 76, max: 85, base: 630, increment: 12 },  // 76=630, 85=522
  { min: 86, max: 95, base: 510, increment: 12 },  // 86=510, 95=402
];

// Direct lookup table for Krokhol ratings (most accurate)
// Based on PDGA rating table provided
const KROKHOL_RATING_LOOKUP: { [score: number]: number } = {
  // 112-103 range
  112: 596, 111: 604, 110: 612, 109: 620, 108: 628, 107: 636, 106: 644, 105: 653, 104: 661, 103: 669,
  // 102-93 range
  102: 677, 101: 685, 100: 693, 99: 701, 98: 709, 97: 718, 96: 726, 95: 734, 94: 742, 93: 750,
  // 92-83 range
  92: 758, 91: 766, 90: 774, 89: 783, 88: 791, 87: 799, 86: 807, 85: 815, 84: 823, 83: 831,
  // 82-73 range
  82: 839, 81: 847, 80: 856, 79: 864, 78: 872, 77: 880, 76: 888, 75: 896, 74: 904, 73: 912,
  // 72-63 range
  72: 921, 71: 929, 70: 937, 69: 945, 68: 953, 67: 961, 66: 969, 65: 977, 64: 985, 63: 994,
  // 62-53 range
  62: 1002, 61: 1010, 60: 1018, 59: 1026, 58: 1034, 57: 1042, 56: 1050, 55: 1059, 54: 1067, 53: 1075,
};

// Score to rating lookup table for Langhus
// Based on PDGA rating table provided:
// Better scores (lower) = higher ratings
// Each stroke worse = 12 rating points lower (same pattern as Ekeberg)
const LANGHUS_RATING_TABLE = [
  { min: 40, max: 49, base: 1099, increment: 12 }, // 40=1099, 48=1003, 49=991
  { min: 50, max: 59, base: 979, increment: 12 },  // 50=979, 58=883, 59=871
  { min: 60, max: 69, base: 859, increment: 12 },  // 60=859, 68=763, 69=751
  { min: 70, max: 79, base: 739, increment: 12 },  // 70=739, 78=643, 79=631
  { min: 80, max: 89, base: 619, increment: 12 },  // 80=619, 88=523, 89=511
  { min: 90, max: 98, base: 499, increment: 12 },  // 90=499, 98=403
];

/**
 * Calculate PDGA rating for a given score at Ekeberg
 * @param score - Total strokes for the round
 * @returns PDGA rating (extrapolated if outside table range)
 */
export function calculateEkebergRating(score: number): number {
  // Find the appropriate range for this score
  for (const range of EKEBERG_RATING_TABLE) {
    if (score >= range.min && score <= range.max) {
      // Calculate rating: base - (score - min) * increment
      // For example: score 45 in range 36-45 (base 1110, increment 12)
      // rating = 1110 - (45 - 36) * 12 = 1110 - 108 = 1002 ✓
      const rating = range.base - (score - range.min) * range.increment;
      return Math.max(0, Math.round(rating)); // Ensure non-negative and round to integer
    }
  }
  
  // Score is outside the lookup table range - extrapolate
  // For scores below 36 (better scores = higher ratings)
  if (score < 36) {
    const lowestRange = EKEBERG_RATING_TABLE[0];
    const extrapolatedRating = lowestRange.base - (score - lowestRange.min) * lowestRange.increment;
    return Math.max(0, Math.round(extrapolatedRating));
  }
  
  // For scores above 95 (worse scores = lower ratings)
  if (score > 95) {
    const highestRange = EKEBERG_RATING_TABLE[EKEBERG_RATING_TABLE.length - 1];
    // Calculate rating for the max score in the range first
    const maxScoreRating = highestRange.base - (highestRange.max - highestRange.min) * highestRange.increment;
    // Then extrapolate from there
    const extrapolatedRating = maxScoreRating - (score - highestRange.max) * highestRange.increment;
    return Math.max(0, Math.round(extrapolatedRating));
  }
  
  // Should never reach here, but return 0 as fallback
  return 0;
}

/**
 * Calculate PDGA rating for Krokhol course
 * @param score - Total strokes for the round
 * @returns PDGA rating (extrapolated if outside table range)
 */
export function calculateKrokholRating(score: number): number {
  // Check direct lookup first (most accurate)
  if (KROKHOL_RATING_LOOKUP[score] !== undefined) {
    return KROKHOL_RATING_LOOKUP[score];
  }

  // Score is outside the lookup table range - extrapolate
  // For scores below 53 (better scores = higher ratings)
  // Average increment is ~8.1 points per stroke in the 53-62 range
  if (score < 53) {
    const lowestRating = KROKHOL_RATING_LOOKUP[53]; // 1075
    const strokesBelow = 53 - score;
    // Use average increment of ~8 points per stroke
    const extrapolatedRating = lowestRating + (strokesBelow * 8);
    return Math.max(0, Math.round(extrapolatedRating));
  }

  // For scores above 112 (worse scores = lower ratings)
  // Average increment is ~8.1 points per stroke in the 103-112 range
  if (score > 112) {
    const highestRating = KROKHOL_RATING_LOOKUP[112]; // 596
    const strokesAbove = score - 112;
    // Use average increment of ~8 points per stroke
    const extrapolatedRating = highestRating - (strokesAbove * 8);
    return Math.max(0, Math.round(extrapolatedRating));
  }

  // Should never reach here, but return 0 as fallback
  return 0;
}

/**
 * Calculate PDGA rating for Langhus course
 * @param score - Total strokes for the round
 * @returns PDGA rating (extrapolated if outside table range)
 */
export function calculateLanghusRating(score: number): number {
  // Find the appropriate range for this score
  for (const range of LANGHUS_RATING_TABLE) {
    if (score >= range.min && score <= range.max) {
      // Calculate rating: base - (score - min) * increment
      // For example: score 48 in range 40-49 (base 1099, increment 12)
      // rating = 1099 - (48 - 40) * 12 = 1099 - 96 = 1003 ✓
      const rating = range.base - (score - range.min) * range.increment;
      return Math.max(0, Math.round(rating)); // Ensure non-negative and round to integer
    }
  }
  
  // Score is outside the lookup table range - extrapolate
  // For scores below 40 (better scores = higher ratings)
  if (score < 40) {
    const lowestRange = LANGHUS_RATING_TABLE[0];
    const extrapolatedRating = lowestRange.base + (lowestRange.min - score) * lowestRange.increment;
    return Math.max(0, Math.round(extrapolatedRating));
  }
  
  // For scores above 98 (worse scores = lower ratings)
  if (score > 98) {
    const highestRange = LANGHUS_RATING_TABLE[LANGHUS_RATING_TABLE.length - 1];
    // Calculate rating for the max score in the range first
    const maxScoreRating = highestRange.base - (highestRange.max - highestRange.min) * highestRange.increment;
    // Then extrapolate from there
    const extrapolatedRating = maxScoreRating - (score - highestRange.max) * highestRange.increment;
    return Math.max(0, Math.round(extrapolatedRating));
  }
  
  // Should never reach here, but return 0 as fallback
  return 0;
}

/**
 * Calculate PDGA rating for any course (Ekeberg, Krokhol, and Langhus supported)
 * @param ctx - Convex context
 * @param courseId - The course ID
 * @param score - Total strokes for the round
 * @returns PDGA rating or null if course doesn't support ratings
 */
export async function calculateRating(
  ctx: any,
  courseId: string,
  score: number
): Promise<number | null> {
  // Get course to check if it supports ratings
  const course = await ctx.db.get(courseId as any);
  
  if (!course) {
    return null;
  }
  
  // Check course name (case-insensitive)
  const courseName = (course.name || '').toLowerCase();
  
  if (courseName.includes('ekeberg')) {
    return calculateEkebergRating(score);
  }
  
  if (courseName.includes('krokhol')) {
    return calculateKrokholRating(score);
  }
  
  if (courseName.includes('langhus')) {
    return calculateLanghusRating(score);
  }
  
  // Add more courses here as needed
  return null;
}

