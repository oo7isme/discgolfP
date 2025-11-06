/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as basket from "../basket.js";
import type * as courses from "../courses.js";
import type * as favoriteCourses from "../favoriteCourses.js";
import type * as friends from "../friends.js";
import type * as goals from "../goals.js";
import type * as groupRounds from "../groupRounds.js";
import type * as pdgaRating from "../pdgaRating.js";
import type * as rounds from "../rounds.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as userPreferences from "../userPreferences.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  basket: typeof basket;
  courses: typeof courses;
  favoriteCourses: typeof favoriteCourses;
  friends: typeof friends;
  goals: typeof goals;
  groupRounds: typeof groupRounds;
  pdgaRating: typeof pdgaRating;
  rounds: typeof rounds;
  seed: typeof seed;
  stats: typeof stats;
  userPreferences: typeof userPreferences;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
