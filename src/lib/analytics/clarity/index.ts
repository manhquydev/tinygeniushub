/**
 * Microsoft Clarity analytics module
 * Main entry point for Clarity integration
 * @module @/lib/analytics/clarity
 */

// Export all types
export * from "./types";

// Export config
export * from "./config";

// Export loader functions
export {
  loadClarity,
  isClarityLoaded,
  setClarityConsent,
  unloadClarity,
} from "./loader";
