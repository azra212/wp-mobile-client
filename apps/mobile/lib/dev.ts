/** The debug screen is off unless a dev build opts in with EXPO_PUBLIC_ENABLE_DEBUG=1. */
export const debugScreenEnabled =
  typeof __DEV__ !== "undefined" &&
  __DEV__ &&
  process.env.EXPO_PUBLIC_ENABLE_DEBUG === "1";
